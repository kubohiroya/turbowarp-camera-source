import {readFileSync} from 'node:fs';
import {dirname, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {expect, it} from 'vitest';
import ts from 'typescript';

/**
 * The preview's reason for existing, as a check rather than a claim.
 *
 * #7 replaced the standard video preview because that one runs `drawImage()` and `getImageData()`
 * for every frame and uploads the `ImageData` to a bitmap skin. The whole point of the skin in
 * `src/video-preview.ts` is that the frame goes `HTMLVideoElement -> texImage2D -> texture` and
 * never reaches the CPU. That property held when it was written and nothing was watching it since:
 * one `getImageData()` added in good faith, or a silhouette hook left to the base class, puts the
 * frames back through the CPU without failing anything.
 *
 * Reading the source rather than the bundle is deliberate. The rest of the extension may use a
 * canvas for its own reasons -- capturing a still image is one -- and a check over the whole bundle
 * would either forbid that or be switched off.
 *
 * Which makes the scope the whole question, and it has to be the code that *runs*. Following every
 * relative import reaches `src/runtime.ts`, which re-exports types from most of the extension, so
 * nine files came back for two that execute -- `src/snapshot.ts` among them, whose whole job is to
 * draw a frame to a canvas. A guard that fails on a module it only ever borrowed a type name from
 * would be switched off within a week, and deserves to be. So type-only imports and exports are not
 * followed: they are erased before anything runs and cannot put a pixel through the CPU.
 */

const root = fileURLToPath(new URL('..', import.meta.url));
const entry = resolve(root, 'src/video-preview.ts');

/** Whether this declaration still exists once the types are erased. */
function survivesErasure(statement: ts.ImportDeclaration | ts.ExportDeclaration): boolean {
  if (ts.isImportDeclaration(statement)) {
    const clause = statement.importClause;
    // `import './side-effect.js'` has no clause at all and is nothing but runtime.
    if (!clause) return true;
    if (clause.isTypeOnly) return false;
    if (clause.name) return true;
    const bindings = clause.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      return bindings.elements.some((element) => !element.isTypeOnly);
    }
    return true;
  }
  if (statement.isTypeOnly) return false;
  const clause = statement.exportClause;
  if (clause && ts.isNamedExports(clause)) {
    return clause.elements.some((element) => !element.isTypeOnly);
  }
  return true;
}

/** `src/video-preview.ts` and the modules it actually loads at run time. */
function displayPathFiles(): Map<string, string> {
  const files = new Map<string, string>();
  const queue = [entry];
  while (queue.length > 0) {
    const path = queue.pop()!;
    if (files.has(path)) continue;
    const source = readFileSync(path, 'utf8');
    files.set(path, source);
    const parsed = ts.createSourceFile(path, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
    for (const statement of parsed.statements) {
      if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
      const specifier = statement.moduleSpecifier;
      if (!specifier || !ts.isStringLiteral(specifier) || !specifier.text.startsWith('.')) continue;
      if (!survivesErasure(statement)) continue;
      const base = resolve(dirname(path), specifier.text.replace(/\.js$/, ''));
      queue.push(`${base}.ts`);
    }
  }
  return files;
}

/** What the last argument of each `texImage2D` call is, as written. */
function texImage2DSources(path: string, source: string): string[] {
  const parsed = ts.createSourceFile(path, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const sources: string[] = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'texImage2D' &&
      node.arguments.length > 0
    ) {
      sources.push(node.arguments[node.arguments.length - 1]!.getText(parsed));
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(parsed, visit);
  return sources;
}

/** Every name the code actually calls or reads, with comments and strings left out. */
function referencedNames(path: string, source: string): Set<string> {
  const names = new Set<string>();
  const parsed = ts.createSourceFile(path, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const visit = (node: ts.Node): void => {
    if (ts.isPropertyAccessExpression(node)) names.add(node.name.text);
    else if (ts.isElementAccessExpression(node) && ts.isStringLiteral(node.argumentExpression)) {
      names.add(node.argumentExpression.text);
    } else if (ts.isIdentifier(node)) names.add(node.text);
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(parsed, visit);
  return names;
}

it('uploads preview frames from the video element and never reads them back to the CPU', () => {
  const files = displayPathFiles();
  const walked = [...files.keys()].map((path) => relative(root, path));

  // The scope, pinned. `src/flip.ts` proves a module that really is loaded gets read, and
  // `src/runtime.ts` -- reached only as `import type {Flip}` -- proves an erased one does not,
  // which is what keeps this from failing on code the preview never executes.
  expect(walked).toContain('src/video-preview.ts');
  expect(walked).toContain('src/flip.ts');
  expect(walked).not.toContain('src/runtime.ts');

  const referenced = new Set<string>();
  for (const [path, source] of files) {
    for (const name of referencedNames(path, source)) referenced.add(name);
  }

  // The upload itself, and that the source it uploads is the video element rather than anything
  // that would have had to be drawn first.
  const uploads = texImage2DSources(entry, files.get(entry)!);
  expect(uploads).toHaveLength(1);
  expect(uploads[0]).toMatch(/(^|\.)video$/);

  // The CPU routes the standard preview takes, and the readback a silhouette would do.
  for (const forbidden of ['drawImage', 'getImageData', 'putImageData', 'readPixels', 'toDataURL', 'toBlob']) {
    expect(referenced.has(forbidden), `${forbidden} is on the preview display path`).toBe(false);
  }

  // The base skin's silhouette reads the texture back to the CPU to answer touching() questions.
  // Overriding it is what keeps a noninteractive preview from paying for that.
  expect(referenced.has('updateSilhouette')).toBe(true);
});

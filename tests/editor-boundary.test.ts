import {execFileSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, cpSync, rmSync, readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, resolve, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {expect, it} from 'vitest';
import ts from 'typescript';
import packageMetadata from '../package.json';

const root = fileURLToPath(new URL('..', import.meta.url));

it('keeps every published pure entry free of third-party runtime imports', () => {
  const queue = ['./runtime', './profile', './editor-schema', './editor-metadata'].map(entry =>
    resolve(root, packageMetadata.exports[entry as './runtime'].import));
  const seen = new Set<string>();
  while (queue.length) {
    const path = queue.pop()!;
    if (seen.has(path)) continue;
    seen.add(path);
    const source = readFileSync(path, 'utf8');
    if (path.endsWith('.json')) continue;
    const parsed = ts.createSourceFile(path, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
    for (const statement of parsed.statements) {
      if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
      const moduleSpecifier = statement.moduleSpecifier;
      if (!moduleSpecifier || !ts.isStringLiteral(moduleSpecifier)) continue;
      const specifier = moduleSpecifier.text;
      expect(specifier.startsWith('.'), `${path} imports ${specifier}`).toBe(true);
      queue.push(resolve(dirname(path), specifier));
    }
  }
  expect(seen.size).toBeGreaterThan(4);
  expect(packageMetadata).not.toHaveProperty('dependencies');
  expect(packageMetadata).not.toHaveProperty('peerDependencies');
});

it('imports distributed metadata in isolation without DOM, GUI, or third-party dependencies', () => {
  const isolated = mkdtempSync(join(tmpdir(), 'camera-source-metadata-'));
  try {
    mkdirSync(join(isolated, 'node_modules', packageMetadata.name), {recursive: true});
    const installed = join(isolated, 'node_modules', packageMetadata.name);
    for (const name of ['dist', 'lib-editor', 'package.json']) cpSync(resolve(root, name), join(installed, name), {recursive: true});
    const script = `
      for (const name of ['window', 'document', 'Scratch']) Object.defineProperty(globalThis, name, {
        get() { throw Error('Unexpected GUI access: ' + name); }
      });
      const metadata = await import('${packageMetadata.name}/editor-metadata');
      const legacy = await import('${packageMetadata.name}/editor-schema');
      if (metadata.cameraProfileSchemaBundles !== legacy.cameraProfileSchemaBundles) throw Error('Duplicate schema owner');
      if (metadata.createSourceEditorOptions().length !== 1 || metadata.fixedInputEditors.length !== 1) throw Error('Missing declarations');
      metadata.registerSourceEditors({})();
      metadata.registerFixedInputEditors({}, metadata.fixedInputEditors)();
      console.log('isolated metadata import passed');
    `;
    expect(execFileSync(process.execPath, ['--input-type=module', '--eval', script], {cwd: isolated, encoding: 'utf8'})).toContain('isolated metadata import passed');
  } finally {
    rmSync(isolated, {recursive: true, force: true});
  }
});

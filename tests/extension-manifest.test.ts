import {describe, expect, it} from 'vitest';
import schema from '../schemas/extension-manifest.schema.json';
import {
  createExtensionManifest,
  EXTENSION_MANIFEST_FORMAT_VERSION,
  serializeExtensionManifest
} from '../src/extension-manifest.js';
import blockDescriptions from '../docs/block-descriptions.json';
import definitions from '../src/block-definitions.json';
import expectedManifest from './fixtures/extension-manifest.json';
import sourceFixture from './fixtures/extension-manifest-source.json';

describe('extension API manifest', () => {
  it('serializes a fixture deterministically', () => {
    expect(createExtensionManifest(sourceFixture.id, sourceFixture.definitions)).toEqual(
      expectedManifest
    );
    expect(serializeExtensionManifest(sourceFixture.id, sourceFixture.definitions)).toBe(
      `${JSON.stringify(expectedManifest, null, 2)}\n`
    );
  });

  it('keeps the JSON Schema format version aligned with the generator', () => {
    expect(schema.properties.formatVersion.const).toBe(EXTENSION_MANIFEST_FORMAT_VERSION);
  });

  it('rejects duplicate opcodes', () => {
    expect(() =>
      createExtensionManifest('fixtureextension', {
        blocks: [
          {opcode: 'same', blockType: 'COMMAND'},
          {opcode: 'same', blockType: 'REPORTER'}
        ]
      })
    ).toThrow('Duplicate block opcode: same');
  });

  it('rejects an argument that references an unknown menu', () => {
    expect(() =>
      createExtensionManifest('fixtureextension', {
        blocks: [
          {
            opcode: 'choose',
            blockType: 'REPORTER',
            arguments: {VALUE: {type: 'STRING', menu: 'missing'}}
          }
        ]
      })
    ).toThrow('references unknown menu: missing');
  });
});

describe('block definitions', () => {
  it('describes every block in both languages', () => {
    // The Japanese README used to be written by hand and drifted: it described a `MIRRORED`
    // argument that no longer existed and listed none of the calibration blocks. Both lists are
    // generated from one file now, so a block missing a sentence has to fail somewhere, and failing
    // in the test suite says so earlier than failing in the docs script.
    const described = blockDescriptions.blocks as Record<string, {en?: string; ja?: string}>;
    const incomplete = (definitions.blocks as ReadonlyArray<{opcode: string}>).filter((block) => {
      const entry = described[block.opcode];
      return !entry?.en?.trim() || !entry.ja?.trim();
    });
    expect(incomplete.map((block) => block.opcode)).toEqual([]);
  });

  it('keeps prose out of the bundled definitions', () => {
    // Everything in block-definitions.json is shipped to every project that loads the extension.
    // Descriptions are read by the documentation and by nothing at runtime, and this package is
    // chosen partly for its size: carrying both languages cost 6.4 kB.
    const bundled = JSON.stringify(definitions);
    expect(bundled).not.toContain('description');
  });
});

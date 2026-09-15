/**
 * Keeps the hand-written validator and the published JSON Schema describing the same contract.
 *
 * The validator ships in the bundle and therefore carries no dependency; the schema is what a reader
 * outside this family gets. Both are checked against one set of fixtures so an added member or a
 * changed bound cannot land in only one of them.
 *
 * The two are not required to be identical. The validator may refuse more, and the cases where it
 * does are listed below with the reason, so the gap stays deliberate instead of accumulating.
 */
import {readFileSync, readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import {describe, expect, it} from 'vitest';

import {parseCameraIntrinsicProfile} from '../src/calibration/profile.js';

const fixtures = new URL('./fixtures/calibration/', import.meta.url);
const schema: object = JSON.parse(
  readFileSync(new URL('../schemas/camera-intrinsics-v1.json', import.meta.url), 'utf8')
);

const validate = new Ajv2020({allErrors: true, strict: true}).compile(schema);

function read(group: string, name: string): unknown {
  return JSON.parse(readFileSync(new URL(`${group}/${name}`, fixtures), 'utf8'));
}

function names(group: string): string[] {
  return readdirSync(fileURLToPath(new URL(`${group}/`, fixtures))).sort();
}

/** Refusals the schema language cannot express, so the bundled validator is the only one that sees them. */
const validatorOnlyRefusals: Readonly<Record<string, string>> = {
  'principal-point-out-of-frame.json':
    'The bound on the principal point is relative to the image size, which JSON Schema cannot reference.'
};

describe('published JSON Schema', () => {
  it('declares the identity consumers resolve it by', () => {
    expect(schema).toMatchObject({
      $id: 'https://kubohiroya.github.io/turbowarp-camera-source/schema/camera-intrinsics-v1.json'
    });
  });

  it('is served at the address its own $id names', () => {
    // The $id points at the GitHub Pages site, which serves docs/. A copy lives there so the
    // identifier resolves instead of promising a document that returns 404.
    const canonical = readFileSync(new URL('../schemas/camera-intrinsics-v1.json', import.meta.url));
    const published = readFileSync(new URL('../docs/schema/camera-intrinsics-v1.json', import.meta.url));
    expect(published.equals(canonical)).toBe(true);
  });

  it.each(names('valid'))('accepts %s, like the bundled validator', (name) => {
    const document = read('valid', name);
    expect(parseCameraIntrinsicProfile(document).ok).toBe(true);
    expect(validate(document) ? null : validate.errors).toBeNull();
  });

  it.each(names('invalid'))('refuses %s unless the gap is a recorded one', (name) => {
    const document = read('invalid', name);
    expect(parseCameraIntrinsicProfile(document).ok).toBe(false);
    if (name in validatorOnlyRefusals) {
      expect(validate(document)).toBe(true);
      return;
    }
    expect(validate(document)).toBe(false);
  });

  it('records a reason for every gap it claims', () => {
    for (const [name, reason] of Object.entries(validatorOnlyRefusals)) {
      expect(names('invalid')).toContain(name);
      expect(reason.length).toBeGreaterThan(0);
    }
  });
});

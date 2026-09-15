import {readFileSync, readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';

import {
  adoptLegacyCameraCalibration,
  parseCameraIntrinsicProfile,
  parseCameraIntrinsicProfileJson,
  serializeCameraIntrinsicProfile
} from '../src/calibration/profile.js';
import type {ProfileErrorCode} from '../src/calibration/types.js';

const fixtures = new URL('./fixtures/calibration/', import.meta.url);

function read(group: string, name: string): unknown {
  return JSON.parse(readFileSync(new URL(`${group}/${name}`, fixtures), 'utf8'));
}

function names(group: string): string[] {
  return readdirSync(fileURLToPath(new URL(`${group}/`, fixtures))).sort();
}

/** Every refusal is expected to name the member at fault, which is what an operator needs to fix it. */
const expectedRejections: Readonly<Record<string, {code: ProfileErrorCode; path: string}>> = {
  'bad-identifier.json': {code: 'invalid-value', path: 'cameraId'},
  'bad-timestamp.json': {code: 'invalid-value', path: 'calibratedAt'},
  'coefficient-count.json': {code: 'invalid-distortion', path: 'distortion.coefficients'},
  'focal-length-as-text.json': {code: 'invalid-type', path: 'intrinsics.fx'},
  'forbidden-nested.json': {code: 'forbidden-field', path: 'device.iceCandidate'},
  'forbidden-top-level.json': {code: 'forbidden-field', path: 'sdp'},
  'local-timestamp.json': {code: 'invalid-value', path: 'calibratedAt'},
  'missing-intrinsics.json': {code: 'missing-field', path: 'intrinsics'},
  'principal-point-out-of-frame.json': {code: 'out-of-range', path: 'intrinsics.cx'},
  'quality-without-samples.json': {code: 'out-of-range', path: 'quality.sampleCount'},
  'undistorted-with-distortion.json': {code: 'inconsistent-profile', path: 'distortion.model'},
  'unknown-distortion-model.json': {code: 'invalid-distortion', path: 'distortion.model'},
  'unknown-member.json': {code: 'unexpected-field', path: 'worldFromCameraMatrix'},
  'wrong-schema.json': {code: 'unsupported-schema', path: 'schema'},
  'wrong-version.json': {code: 'unsupported-version', path: 'version'},
  'zero-focal-length.json': {code: 'out-of-range', path: 'intrinsics.fx'}
};

describe('camera intrinsic profiles', () => {
  it.each(names('valid'))('accepts %s', (name) => {
    const result = parseCameraIntrinsicProfile(read('valid', name));
    expect(result.ok ? null : result.error).toBeNull();
  });

  it.each(names('invalid'))('refuses %s with a reason', (name) => {
    const result = parseCameraIntrinsicProfile(read('invalid', name));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect({code: result.error.code, path: result.error.path}).toEqual(expectedRejections[name]);
    expect(result.error.message.length).toBeGreaterThan(0);
  });

  it('covers every invalid fixture with an expectation', () => {
    expect(names('invalid')).toEqual(Object.keys(expectedRejections).sort());
  });

  it('keeps the profile intact through a serialize and parse round trip', () => {
    const parsed = parseCameraIntrinsicProfile(read('valid', 'full.json'));
    if (!parsed.ok) throw new Error(parsed.error.message);
    const text = serializeCameraIntrinsicProfile(parsed.profile);
    const again = parseCameraIntrinsicProfileJson(text);
    if (!again.ok) throw new Error(again.error.message);
    expect(again.profile).toEqual(parsed.profile);
    expect(serializeCameraIntrinsicProfile(again.profile)).toBe(text);
  });

  it('leaves unknown quality unknown rather than reporting a measured zero', () => {
    const parsed = parseCameraIntrinsicProfile(read('valid', 'minimal.json'));
    if (!parsed.ok) throw new Error(parsed.error.message);
    expect(parsed.profile.quality).toBeUndefined();
    expect(serializeCameraIntrinsicProfile(parsed.profile)).not.toContain('quality');
  });

  it('refuses text that is not JSON', () => {
    const result = parseCameraIntrinsicProfileJson('not json');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('not-an-object');
  });

  it('refuses a document that is not an object', () => {
    for (const input of [null, 42, 'profile', [], true]) {
      const result = parseCameraIntrinsicProfile(input);
      expect(result.ok).toBe(false);
    }
  });

  it('refuses a cyclic document instead of walking it forever', () => {
    const cyclic: Record<string, unknown> = {schema: 'twcs/camera-intrinsics', version: 1};
    cyclic['device'] = cyclic;
    const result = parseCameraIntrinsicProfile(cyclic);
    expect(result.ok).toBe(false);
  });
});

describe('legacy twrmc/camera-calibration documents', () => {
  it('reads the intrinsics out of the row-major matrix', () => {
    const result = adoptLegacyCameraCalibration(read('legacy', 'valid.json'));
    if (!result.ok) throw new Error(`${result.error.path}: ${result.error.message}`);
    expect(result.profile.intrinsics).toEqual({
      fx: 1400.5,
      fy: 1399.25,
      cx: 959.5,
      cy: 539.5,
      skew: 0
    });
    expect(result.profile.image).toEqual({width: 1920, height: 1080, undistorted: false});
    expect(result.profile.distortion.model).toBe('brown-conrady');
    expect(result.profile.profileId).toBe('venue-a-run-3');
    expect(result.profile.cameraId).toBe('stage-left');
  });

  it('drops the world pose instead of carrying it forward as a placement', () => {
    const result = adoptLegacyCameraCalibration(read('legacy', 'valid.json'));
    if (!result.ok) throw new Error(result.error.message);
    expect(serializeCameraIntrinsicProfile(result.profile)).not.toContain('worldFromCamera');
    expect(Object.keys(result.profile)).not.toContain('worldFromCameraMatrix');
  });

  it('reports no quality rather than inventing one the old format never recorded', () => {
    const result = adoptLegacyCameraCalibration(read('legacy', 'valid.json'));
    if (!result.ok) throw new Error(result.error.message);
    expect(result.profile.quality).toBeUndefined();
  });

  it('maps an empty coefficient list to no distortion', () => {
    const result = adoptLegacyCameraCalibration(read('legacy', 'undistorted-lens.json'));
    if (!result.ok) throw new Error(result.error.message);
    expect(result.profile.distortion).toEqual({model: 'none', coefficients: []});
    expect(result.profile.image.undistorted).toBe(false);
  });

  it('refuses a matrix whose bottom rows are not the affine ones', () => {
    const result = adoptLegacyCameraCalibration(read('legacy', 'not-affine.json'));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('inconsistent-profile');
  });

  it('refuses a coefficient count no consumer implements', () => {
    const result = adoptLegacyCameraCalibration(read('legacy', 'unsupported-coefficients.json'));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('invalid-distortion');
  });

  it('refuses a current profile handed to the legacy reader', () => {
    const result = adoptLegacyCameraCalibration(read('valid', 'full.json'));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('unsupported-schema');
  });
});

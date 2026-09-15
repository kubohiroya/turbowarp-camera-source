import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';

import type {CameraConditions} from '../src/calibration/conditions.js';
import {CameraProfileRegistry} from '../src/calibration/registry.js';

function document(name: string): Record<string, unknown> {
  return JSON.parse(
    readFileSync(new URL(`./fixtures/calibration/valid/${name}`, import.meta.url), 'utf8')
  );
}

function conditions(width: number, height: number): CameraConditions {
  return {width, height, deviceId: 'device-1', mirrored: false};
}

describe('the profile registry', () => {
  it('accepts a valid document and keys it by camera', () => {
    const registry = new CameraProfileRegistry();
    const source = document('minimal.json');
    expect(registry.register(source).ok).toBe(true);
    expect(registry.has(source.cameraId as string)).toBe(true);
    expect(registry.cameraIds()).toEqual([source.cameraId]);
  });

  it('stores nothing when the document does not pass', () => {
    // A half-registered profile is indistinguishable from a good one at the
    // point of use, so validation has to complete before anything is written.
    const registry = new CameraProfileRegistry();
    const result = registry.register({schema: 'twcs/camera-intrinsics', version: 1});
    expect(result.ok).toBe(false);
    expect(registry.cameraIds()).toEqual([]);
  });

  it('asks nothing about where a profile came from', () => {
    const registry = new CameraProfileRegistry();
    const fromOperator = {...document('minimal.json'), producer: 'pasted by hand'};
    expect(registry.register(fromOperator).ok).toBe(true);
  });

  it('replaces the profile in force rather than accumulating beside it', () => {
    const registry = new CameraProfileRegistry();
    const first = document('minimal.json');
    registry.register(first);
    registry.register({...first, profileId: 'run-2'});
    expect(registry.cameraIds()).toHaveLength(1);
    expect(registry.get(first.cameraId as string)?.profileId).toBe('run-2');
  });

  it('treats an uncalibrated camera as an ordinary state', () => {
    const registry = new CameraProfileRegistry();
    const result = registry.assess('never-calibrated', conditions(1280, 720));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/No calibration profile/);
  });

  it('judges a stored profile against the camera as configured now', () => {
    const registry = new CameraProfileRegistry();
    const source = document('minimal.json');
    registry.register(source);
    const image = source.image as {width: number; height: number};
    const assessment = registry.assess(source.cameraId as string, conditions(image.width, image.height));
    expect(assessment.ok).toBe(true);
    if (!assessment.ok) return;
    expect(assessment.assessment.adaptation.state).toBe('exact');
    expect(assessment.assessment.compatibility.state).toBeDefined();
  });

  it('forgets a profile on request', () => {
    const registry = new CameraProfileRegistry();
    const source = document('minimal.json');
    registry.register(source);
    expect(registry.forget(source.cameraId as string)).toBe(true);
    expect(registry.has(source.cameraId as string)).toBe(false);
  });
});

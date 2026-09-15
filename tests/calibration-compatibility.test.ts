import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';

import {
  decisiveFindings,
  evaluateProfileCompatibility,
  type CompatibilityCode,
  type CompatibilityReport
} from '../src/calibration/compatibility.js';
import {captureFromConditions, readCameraConditions} from '../src/calibration/conditions.js';
import {parseCameraIntrinsicProfile} from '../src/calibration/profile.js';
import type {CameraIntrinsicProfileV1} from '../src/calibration/types.js';

const fixtures = new URL('./fixtures/calibration/', import.meta.url);

function profile(name: string): CameraIntrinsicProfileV1 {
  const document: unknown = JSON.parse(readFileSync(new URL(`valid/${name}`, fixtures), 'utf8'));
  const result = parseCameraIntrinsicProfile(document);
  if (!result.ok) throw new Error(`${result.error.path}: ${result.error.message}`);
  return result.profile;
}

/** The conditions the `with-capture` fixture was solved under, so tests can vary one member at a time. */
function matchingConditions(overrides: Record<string, unknown> = {}) {
  return readCameraConditions(
    {width: 1920, height: 1080, previewFlip: 'none', pixelFlip: 'none', deviceId: 'b1c2d3e4', label: 'HD Pro Webcam C920'},
    {frameRate: 30, facingMode: 'user', resizeMode: 'none', focusMode: 'continuous', ...overrides}
  );
}

function find(report: CompatibilityReport, code: CompatibilityCode) {
  const entry = report.findings.find((candidate) => candidate.code === code);
  if (!entry) throw new Error(`No finding for ${code}.`);
  return entry;
}

describe('profile compatibility', () => {
  it('accepts a profile whose every decisive member is known and matching', () => {
    const report = evaluateProfileCompatibility(profile('with-capture.json'), matchingConditions());
    expect(report.state).toBe('compatible');
    expect(decisiveFindings(report)).toEqual([]);
  });

  it('refuses a profile solved at another resolution', () => {
    const conditions = readCameraConditions({
      width: 1280,
      height: 720,
      previewFlip: 'none', pixelFlip: 'none',
      deviceId: 'b1c2d3e4'
    });
    const report = evaluateProfileCompatibility(profile('with-capture.json'), conditions);
    expect(report.state).toBe('incompatible');
    expect(find(report, 'image-size').state).toBe('mismatched');
  });

  it('cannot decide before a frame has arrived', () => {
    const conditions = readCameraConditions({width: 0, height: 0, previewFlip: 'none', pixelFlip: 'none', deviceId: ''});
    const report = evaluateProfileCompatibility(profile('with-capture.json'), conditions);
    expect(report.state).toBe('undetermined');
    expect(find(report, 'image-size').state).toBe('unknown');
  });

  it('cannot decide when the profile recorded no capture conditions', () => {
    const report = evaluateProfileCompatibility(profile('full.json'), matchingConditions());
    expect(report.state).toBe('undetermined');
    expect(find(report, 'capture-conditions').state).toBe('unknown');
  });

  it('refuses a camera that has been switched to cropping', () => {
    const report = evaluateProfileCompatibility(
      profile('with-capture.json'),
      matchingConditions({resizeMode: 'crop-and-scale'})
    );
    expect(report.state).toBe('incompatible');
    expect(find(report, 'resize-mode').state).toBe('mismatched');
  });

  it('refuses a camera whose focus mode changed', () => {
    const report = evaluateProfileCompatibility(
      profile('with-capture.json'),
      matchingConditions({focusMode: 'manual'})
    );
    expect(report.state).toBe('incompatible');
    expect(find(report, 'focus-mode').state).toBe('mismatched');
  });

  it('treats a control absent on both sides as agreement, not as ignorance', () => {
    const report = evaluateProfileCompatibility(profile('with-capture.json'), matchingConditions());
    expect(find(report, 'zoom').state).toBe('matched');
    expect(find(report, 'zoom').detail).toContain('Neither');
  });

  it('cannot decide when a control appears on only one side', () => {
    const report = evaluateProfileCompatibility(
      profile('with-capture.json'),
      matchingConditions({zoom: 2})
    );
    expect(report.state).toBe('undetermined');
    expect(find(report, 'zoom').state).toBe('unknown');
  });

  it('lets a frame rate change pass without touching the verdict', () => {
    const report = evaluateProfileCompatibility(
      profile('with-capture.json'),
      matchingConditions({frameRate: 60})
    );
    expect(report.state).toBe('compatible');
    expect(find(report, 'frame-rate').decisive).toBe(false);
  });

  it('ignores preview mirroring, which is a display choice and not a calibration', () => {
    const mirrored = readCameraConditions(
      {width: 1920, height: 1080, previewFlip: 'horizontal', pixelFlip: 'none', deviceId: 'b1c2d3e4', label: 'HD Pro Webcam C920'},
      {frameRate: 30, facingMode: 'user', resizeMode: 'none', focusMode: 'continuous'}
    );
    const report = evaluateProfileCompatibility(profile('with-capture.json'), mirrored);
    expect(report.state).toBe('compatible');
    expect(report.findings.some((entry) => entry.code.includes('mirror'))).toBe(false);
  });

  it('refuses a camera reporting a different model than the one calibrated', () => {
    const report = evaluateProfileCompatibility(
      profile('with-capture.json'),
      readCameraConditions(
        {width: 1920, height: 1080, previewFlip: 'none', pixelFlip: 'none', deviceId: 'b1c2d3e4', label: 'Integrated Camera'},
        {frameRate: 30, facingMode: 'user', resizeMode: 'none', focusMode: 'continuous'}
      )
    );
    expect(report.state).toBe('incompatible');
    expect(find(report, 'device-label').state).toBe('mismatched');
  });

  it('never lets a device id decide anything', () => {
    const report = evaluateProfileCompatibility(
      profile('with-capture.json'),
      matchingConditions({})
    );
    expect(find(report, 'device-id').decisive).toBe(false);

    const renumbered = evaluateProfileCompatibility(
      profile('with-capture.json'),
      readCameraConditions(
        {width: 1920, height: 1080, previewFlip: 'none', pixelFlip: 'none', deviceId: 'a-new-id', label: 'HD Pro Webcam C920'},
        {frameRate: 30, facingMode: 'user', resizeMode: 'none', focusMode: 'continuous'}
      )
    );
    expect(renumbered.state).toBe('compatible');
  });

  it('refuses frames whose pixels have been turned over', () => {
    // The preview flip above is a display choice and must not decide anything. This is the other
    // fact the same boolean used to carry: the image a consumer is handed is not the one the
    // camera captured, so the calibrated principal point is on the wrong side. The pose that comes
    // back from it is a reflection whose reprojection error stays small, which is why it has to be
    // refused here rather than noticed downstream.
    const flipped = readCameraConditions(
      {
        width: 1920,
        height: 1080,
        previewFlip: 'none',
        pixelFlip: 'horizontal',
        deviceId: 'b1c2d3e4',
        label: 'HD Pro Webcam C920'
      },
      {frameRate: 30, facingMode: 'user', resizeMode: 'none', focusMode: 'continuous'}
    );
    const report = evaluateProfileCompatibility(profile('with-capture.json'), flipped);
    expect(report.state).toBe('incompatible');
    expect(find(report, 'pixel-flip').state).toBe('mismatched');
  });

  it('cannot confirm a profile that claims already undistorted images', () => {
    const conditions = readCameraConditions({
      width: 1920,
      height: 1080,
      previewFlip: 'none', pixelFlip: 'none',
      deviceId: 'b1c2d3e4'
    });
    const report = evaluateProfileCompatibility(profile('undistorted.json'), conditions);
    expect(report.state).toBe('undetermined');
    expect(find(report, 'undistorted-frames').state).toBe('unknown');
  });

  it('gives every finding a reason an operator can act on', () => {
    const report = evaluateProfileCompatibility(profile('full.json'), matchingConditions());
    for (const entry of report.findings) {
      expect(entry.detail.length).toBeGreaterThan(0);
    }
  });
});

describe('camera conditions', () => {
  it('takes the frame size from the delivered frame, not from the requested settings', () => {
    const conditions = readCameraConditions(
      {width: 1280, height: 720, previewFlip: 'none', pixelFlip: 'none', deviceId: 'x'},
      {frameRate: 30}
    );
    expect(conditions.width).toBe(1280);
    expect(conditions.height).toBe(720);
  });

  it('leaves a control absent when the device reports nothing usable for it', () => {
    const conditions = readCameraConditions(
      {width: 640, height: 480, previewFlip: 'none', pixelFlip: 'none', deviceId: 'x'},
      {zoom: Number.NaN, focusMode: '   ', frameRate: 0, focusDistance: -1}
    );
    expect(conditions.zoom).toBeUndefined();
    expect(conditions.focusMode).toBeUndefined();
    expect(conditions.frameRate).toBeUndefined();
    expect(conditions.focusDistance).toBeUndefined();
  });

  it('reports no frame size before a frame has arrived instead of guessing one', () => {
    const conditions = readCameraConditions({
      width: Number.NaN,
      height: 0,
      previewFlip: 'none', pixelFlip: 'none',
      deviceId: ''
    });
    expect(conditions.width).toBe(0);
    expect(conditions.height).toBe(0);
  });

  it('records the conditions a producer should store, and reads them back as compatible', () => {
    const conditions = matchingConditions();
    const capture = captureFromConditions(conditions);
    const solved = parseCameraIntrinsicProfile({
      ...profile('full.json'),
      capture
    });
    if (!solved.ok) throw new Error(solved.error.message);
    expect(evaluateProfileCompatibility(solved.profile, conditions).state).toBe('compatible');
  });
});

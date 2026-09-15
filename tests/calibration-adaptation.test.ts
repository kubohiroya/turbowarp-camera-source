import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';

import {adaptProfileToConditions, scaleIntrinsics} from '../src/calibration/adaptation.js';
import type {CameraConditions} from '../src/calibration/conditions.js';
import {parseCameraIntrinsicProfile} from '../src/calibration/profile.js';
import type {CameraIntrinsicProfileV1} from '../src/calibration/types.js';

function profile(name: string): CameraIntrinsicProfileV1 {
  const document = JSON.parse(
    readFileSync(new URL(`./fixtures/calibration/valid/${name}`, import.meta.url), 'utf8')
  );
  const result = parseCameraIntrinsicProfile(document);
  if (!result.ok) throw new Error(`fixture ${name} does not parse: ${result.error.message}`);
  return result.profile;
}

function conditions(width: number, height: number, extra: Partial<CameraConditions> = {}): CameraConditions {
  return {width, height, deviceId: 'device-1', previewFlip: 'none', ...extra};
}

describe('adapting a profile to the frame it meets', () => {
  it('hands back the calibrated intrinsics when the size already agrees', () => {
    const subject = profile('minimal.json');
    const adaptation = adaptProfileToConditions(
      subject,
      conditions(subject.image.width, subject.image.height)
    );
    expect(adaptation.state).toBe('exact');
    expect(adaptation.intrinsics).toEqual(subject.intrinsics);
    expect(adaptation.scale).toBe(1);
  });

  it('scales the intrinsics for a pure downscale', () => {
    // The consumer must not do this itself: from the two sizes alone a scale
    // and a crop look the same, and they need different arithmetic.
    const subject = profile('minimal.json');
    const half = adaptProfileToConditions(
      subject,
      conditions(subject.image.width / 2, subject.image.height / 2)
    );
    expect(half.state).toBe('scaled');
    expect(half.scale).toBeCloseTo(0.5, 12);
    expect(half.intrinsics?.fx).toBeCloseTo(subject.intrinsics.fx / 2, 9);
    expect(half.intrinsics?.cx).toBeCloseTo(subject.intrinsics.cx / 2, 9);
  });

  it('leaves skew alone, since it is a ratio between the axes', () => {
    expect(scaleIntrinsics({fx: 100, fy: 100, cx: 50, cy: 40, skew: 0.5}, 2)).toEqual({
      fx: 200,
      fy: 200,
      cx: 100,
      cy: 80,
      skew: 0.5
    });
  });

  it('refuses when the aspect ratio changed', () => {
    const subject = profile('minimal.json');
    const adaptation = adaptProfileToConditions(subject, conditions(640, 640));
    expect(adaptation.state).toBe('unavailable');
    expect(adaptation.code).toBe('aspect-changed');
    expect(adaptation.intrinsics).toBeUndefined();
  });

  it('refuses when the track may have cropped rather than scaled', () => {
    // crop-and-scale moves the principal point by an amount nothing reports.
    // Assuming a scale would place the optical centre wrongly, and the error
    // reads as a slightly rotated camera rather than as a mistake.
    const subject = profile('with-capture.json');
    const cropping: CameraIntrinsicProfileV1 = {
      ...subject,
      capture: {...subject.capture, resizeMode: 'crop-and-scale'}
    };
    const adaptation = adaptProfileToConditions(
      cropping,
      conditions(subject.image.width / 2, subject.image.height / 2)
    );
    expect(adaptation.state).toBe('unavailable');
    expect(adaptation.code).toBe('cropped');
  });

  it('refuses for a profile describing already corrected images', () => {
    const subject = profile('undistorted.json');
    const adaptation = adaptProfileToConditions(
      subject,
      conditions(subject.image.width / 2, subject.image.height / 2)
    );
    expect(adaptation.state).toBe('unavailable');
    expect(adaptation.code).toBe('undistorted-frames');
  });

  it('refuses before any frame has arrived', () => {
    const adaptation = adaptProfileToConditions(profile('minimal.json'), conditions(0, 0));
    expect(adaptation.state).toBe('unavailable');
    expect(adaptation.code).toBe('no-frame');
  });
});

import {readFileSync, readdirSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {
  CAMERA_INFO_EXTENSION_KEY,
  readCameraInfoYaml,
  serializeCameraInfoYaml
} from '../src/calibration/camera-info.js';
import {readProfileText} from '../src/calibration/profile-text.js';
import {readCameraProfileDocument} from '../src/calibration/profile.js';
import type {CameraIntrinsicProfileV1} from '../src/calibration/types.js';
import {parseYaml} from '../src/calibration/yaml.js';

const validDirectory = new URL('./fixtures/calibration/valid/', import.meta.url);

function valid(name: string): CameraIntrinsicProfileV1 {
  const result = readCameraProfileDocument(JSON.parse(readFileSync(new URL(name, validDirectory), 'utf8')));
  if (!result.ok) throw new Error(`${name} is not a valid fixture: ${result.error.message}`);
  return result.profile;
}

function cameraInfo(name: string): string {
  return readFileSync(new URL(`./fixtures/calibration/camera-info/${name}`, import.meta.url), 'utf8');
}

function readYaml(text: string) {
  const read = readCameraInfoYaml(text);
  if (!read.ok) return read;
  return readCameraProfileDocument(read.document);
}

/** A written file with one line replaced, for refusals that only differ from a good file in one place. */
function withLine(text: string, match: RegExp, replacement: string): string {
  expect(text).toMatch(match);
  return text.replace(match, replacement);
}

describe('a profile written as ROS camera_info YAML', () => {
  const fixtures = readdirSync(validDirectory).filter((name) => name.endsWith('.json'));

  it.each(fixtures)('reads back as the same profile: %s', (name) => {
    const profile = valid(name);
    const read = readYaml(serializeCameraInfoYaml(profile));
    expect(read).toEqual({ok: true, profile});
  });

  it('carries everything ROS reads, under the names and shapes ROS reads them', () => {
    // The keys and the rows/cols/data layout are what camera_calibration_parsers looks up. Checked as
    // parsed values rather than as text, so the test is about what a YAML reader sees.
    const profile = valid('full.json');
    const document = parseYaml(serializeCameraInfoYaml(profile)) as Record<string, unknown>;
    expect(document['image_width']).toBe(1920);
    expect(document['image_height']).toBe(1080);
    expect(document['camera_name']).toBe('stage-left');
    expect(document['camera_matrix']).toEqual({
      rows: 3,
      cols: 3,
      data: [1400.5, 0, 959.5, 0, 1399.25, 539.5, 0, 0, 1]
    });
    expect(document['distortion_model']).toBe('plumb_bob');
    expect(document['distortion_coefficients']).toEqual({
      rows: 1,
      cols: 5,
      data: [-0.32115, 0.11042, 0.00021, -0.00034, -0.01877]
    });
    expect(document['rectification_matrix']).toEqual({rows: 3, cols: 3, data: [1, 0, 0, 0, 1, 0, 0, 0, 1]});
    expect(document['projection_matrix']).toEqual({
      rows: 3,
      cols: 4,
      data: [1400.5, 0, 959.5, 0, 0, 1399.25, 539.5, 0, 0, 0, 1, 0]
    });
  });

  it('names each ROS distortion model the way sensor_msgs does', () => {
    const models = (name: string) =>
      (parseYaml(serializeCameraInfoYaml(valid(name))) as Record<string, unknown>)['distortion_model'];
    expect(models('minimal.json')).toBe('plumb_bob');
    expect(models('rational.json')).toBe('rational_polynomial');
    expect(models('fisheye.json')).toBe('equidistant');
  });

  it('writes a lens-free image as plumb_bob with five zeros, since ROS has no model for none', () => {
    const document = parseYaml(serializeCameraInfoYaml(valid('undistorted.json'))) as Record<string, unknown>;
    expect(document['distortion_model']).toBe('plumb_bob');
    expect(document['distortion_coefficients']).toEqual({rows: 1, cols: 5, data: [0, 0, 0, 0, 0]});
  });

  it('quotes the timestamp so a YAML 1.1 reader does not turn it into a date', () => {
    expect(serializeCameraInfoYaml(valid('full.json'))).toContain('calibratedAt: "2026-09-15T04:05:06.125Z"');
  });

  it('puts what ROS has no place for under one extra key', () => {
    const document = parseYaml(serializeCameraInfoYaml(valid('with-capture.json'))) as Record<string, unknown>;
    const extra = document[CAMERA_INFO_EXTENSION_KEY] as Record<string, unknown>;
    const rosKeys = [
      'image_width',
      'image_height',
      'camera_name',
      'camera_matrix',
      'distortion_model',
      'distortion_coefficients',
      'rectification_matrix',
      'projection_matrix'
    ];
    expect(Object.keys(document)).toEqual([...rosKeys, CAMERA_INFO_EXTENSION_KEY]);
    expect(extra['schema']).toBe('twcs/camera-intrinsics');
    expect(extra['capture']).toBeDefined();
  });
});

describe('reading a camera_info file', () => {
  it('reads a file written the way yaml-cpp writes, with binning and a whole-image ROI', () => {
    const read = readYaml(cameraInfo('yaml-cpp.yaml'));
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.profile.intrinsics).toEqual({fx: 1400.5, fy: 1399.25, cx: 959.5, cy: 539.5, skew: 0});
    expect(read.profile.capture).toEqual({resizeMode: 'none', zoom: 1, focusMode: 'manual', focusDistance: 0.4});
    expect(read.profile.device).toEqual({label: 'HD Pro Webcam C920'});
  });

  it('reads the matrices of a file ROS calibration wrote, wrapped lines and all', () => {
    const parsed = parseYaml(cameraInfo('ros-camera-calibration.yaml')) as Record<string, {data: number[]}>;
    expect(parsed['camera_matrix']!.data).toEqual([430.21554, 0, 306.6195, 0, 430.53913, 227.22923, 0, 0, 1]);
    expect(parsed['projection_matrix']!.data).toHaveLength(12);
  });

  it('refuses a plain ROS file for lacking the calibration record, and says what is missing', () => {
    const read = readCameraInfoYaml(cameraInfo('ros-camera-calibration.yaml'));
    expect(read).toMatchObject({ok: false, error: {code: 'missing-field', path: CAMERA_INFO_EXTENSION_KEY}});
  });

  it('refuses a rectification other than identity, which belongs to a stereo pair', () => {
    const text = withLine(cameraInfo('yaml-cpp.yaml'), /rectification_matrix:\n {2}rows: 3\n {2}cols: 3\n {2}data: \[1, 0, 0/, 'rectification_matrix:\n  rows: 3\n  cols: 3\n  data: [0.99, 0.01, 0');
    expect(readCameraInfoYaml(text)).toMatchObject({ok: false, error: {code: 'inconsistent-profile'}});
  });

  it('refuses a binned image and a cropped region', () => {
    expect(readCameraInfoYaml(withLine(cameraInfo('yaml-cpp.yaml'), /binning_x: 0/, 'binning_x: 2'))).toMatchObject({
      ok: false,
      error: {code: 'inconsistent-profile', path: 'binning_x'}
    });
    expect(readCameraInfoYaml(withLine(cameraInfo('yaml-cpp.yaml'), /x_offset: 0/, 'x_offset: 10'))).toMatchObject({
      ok: false,
      error: {code: 'inconsistent-profile', path: 'roi'}
    });
  });

  it('refuses a calibration matrix whose last row is not 0 0 1', () => {
    const text = withLine(cameraInfo('yaml-cpp.yaml'), /539\.5, 0, 0, 1\]/, '539.5, 0, 0, 2]');
    expect(readCameraInfoYaml(text)).toMatchObject({ok: false, error: {code: 'inconsistent-profile', path: 'camera_matrix.data[8]'}});
  });

  it('refuses a matrix whose data does not fill its declared size', () => {
    const text = withLine(cameraInfo('yaml-cpp.yaml'), /data: \[1400\.5, 0, 959\.5, 0, 1399\.25, 539\.5, 0, 0, 1\]/, 'data: [1400.5, 0, 959.5]');
    expect(readCameraInfoYaml(text)).toMatchObject({ok: false, error: {code: 'invalid-value', path: 'camera_matrix.data'}});
  });

  it('refuses a coefficient count ROS does not define for the model', () => {
    const text = withLine(cameraInfo('yaml-cpp.yaml'), /cols: 5\n {2}data: \[-0\.32115/, 'cols: 6\n  data: [0, -0.32115');
    expect(readCameraInfoYaml(text)).toMatchObject({ok: false, error: {code: 'invalid-distortion'}});
  });

  it('refuses a distortion model ROS does not name', () => {
    const text = withLine(cameraInfo('yaml-cpp.yaml'), /distortion_model: plumb_bob/, 'distortion_model: brown-conrady');
    expect(readCameraInfoYaml(text)).toMatchObject({ok: false, error: {code: 'invalid-distortion', path: 'distortion_model'}});
  });

  it('refuses a top-level key nobody reads rather than dropping it', () => {
    const text = `${cameraInfo('yaml-cpp.yaml')}sdp: "v=0"\n`;
    expect(readCameraInfoYaml(text)).toMatchObject({ok: false, error: {code: 'unexpected-field', path: 'sdp'}});
  });

  it('leaves the values to the profile validator, so YAML is refused for the same reasons as JSON', () => {
    const text = withLine(cameraInfo('yaml-cpp.yaml'), /calibratedAt: "2026-09-15T04:05:06.125Z"/, 'calibratedAt: "2026-09-15 13:05"');
    expect(readYaml(text)).toMatchObject({ok: false, error: {code: 'invalid-value', path: 'calibratedAt'}});
    const withCredential = withLine(cameraInfo('yaml-cpp.yaml'), / {4}label: HD Pro Webcam C920/, '    label: HD Pro Webcam C920\n    password: "hunter2"');
    expect(readYaml(withCredential)).toMatchObject({ok: false});
  });
});

describe('profile text', () => {
  it('reads JSON when the text starts with a brace, and YAML otherwise', () => {
    const profile = valid('full.json');
    const fromJson = readProfileText(JSON.stringify(profile));
    const fromYaml = readProfileText(serializeCameraInfoYaml(profile));
    expect(fromJson.ok && readCameraProfileDocument(fromJson.document)).toEqual({ok: true, profile});
    expect(fromYaml.ok && readCameraProfileDocument(fromYaml.document)).toEqual({ok: true, profile});
  });

  it('refuses empty text and names broken JSON as JSON', () => {
    expect(readProfileText('  ')).toMatchObject({ok: false, error: {code: 'not-an-object'}});
    expect(readProfileText('{"schema": ')).toMatchObject({ok: false, error: {message: 'The profile is not valid JSON.'}});
  });
});

describe('the YAML reader', () => {
  it('reads block and flow collections, quotes, and comments', () => {
    expect(
      parseYaml(
        [
          '# comment',
          'a: 1',
          'b: "two # not a comment"',
          "c: 'it''s'",
          'd:',
          '- 1.5',
          '- -2e3',
          'e: {x: [1, 2], y: null}',
          'f: true # trailing'
        ].join('\n')
      )
    ).toEqual({a: 1, b: 'two # not a comment', c: "it's", d: [1.5, -2000], e: {x: [1, 2], y: null}, f: true});
  });

  it.each([
    ['an anchor', 'a: &x 1'],
    ['an alias', 'a: *x'],
    ['a tag', 'a: !!float 1'],
    ['a block scalar', 'a: |\n  text'],
    ['two documents', 'a: 1\n---\nb: 2'],
    ['a duplicate key', 'a: 1\na: 2'],
    ['an unclosed bracket', 'a: [1, 2'],
    ['infinity', 'a: .inf'],
    ['a tab indent', 'a:\n\tb: 1']
  ])('refuses %s', (_label, text) => {
    expect(() => parseYaml(text)).toThrow();
  });
});

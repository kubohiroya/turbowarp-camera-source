/**
 * The file a calibration is exchanged in: a ROS `camera_info` YAML document.
 *
 * The profile contract is how this extension holds a calibration; it is not a format anyone outside
 * this family reads. A file an operator carries between machines is better written in the format
 * the tools they will meet already read, and for one camera's intrinsics that is the YAML that
 * ROS's `camera_calibration_parsers` reads and writes -- OpenCV-based pipelines, ROS and ROS 2
 * drivers, and SLAM tools load it as it is.
 *
 * ROS carries what projection needs and nothing about when or how the camera was configured, which
 * is exactly what deciding whether a profile still fits requires. Those members travel in one extra
 * top-level mapping, `turbowarp_camera_source`, named after their owner. ROS's reader looks keys up
 * by name and never enumerates the document, so a file with the extra mapping still loads there,
 * and a file without it is still ROS.
 *
 * A file that lacks the mapping altogether cannot become a profile: when it was calibrated and which
 * run it was are required members, and inventing either would turn "unknown" into a record.
 */
import {CAMERA_INTRINSIC_PROFILE_SCHEMA, CAMERA_INTRINSIC_PROFILE_VERSION} from './profile.js';
import type {CameraIntrinsicProfileV1, DistortionModel, ProfileError} from './types.js';
import {parseYaml, YamlError, type YamlValue} from './yaml.js';

/** The top-level key holding the members ROS has no place for. */
export const CAMERA_INFO_EXTENSION_KEY = 'turbowarp_camera_source';

const MATRIX_TOLERANCE = 1e-6;

/**
 * Every top-level key a ROS file may have, and the extra mapping.
 *
 * Anything else is refused rather than dropped. A calibration file that carries a key nobody reads
 * is either from a tool that means something by it or has had something pasted into it, and a
 * profile validator that fails closed does not start ignoring members because they arrived in YAML.
 */
const ROOT_KEYS: ReadonlySet<string> = new Set([
  'image_width',
  'image_height',
  'camera_name',
  'camera_matrix',
  'distortion_model',
  'distortion_coefficients',
  'rectification_matrix',
  'projection_matrix',
  'binning_x',
  'binning_y',
  'roi',
  CAMERA_INFO_EXTENSION_KEY
]);

/** ROS distortion model names, as `sensor_msgs/distortion_models.hpp` spells them. */
const PLUMB_BOB = 'plumb_bob';
const RATIONAL_POLYNOMIAL = 'rational_polynomial';
const EQUIDISTANT = 'equidistant';

export type CameraInfoReadResult =
  | {readonly ok: true; readonly document: Record<string, unknown>}
  | {readonly ok: false; readonly error: ProfileError};

class CameraInfoRejection extends Error {
  public constructor(public readonly detail: ProfileError) {
    super(detail.message);
  }
}

function refuse(code: ProfileError['code'], path: string, message: string): never {
  throw new CameraInfoRejection({code, path, message});
}

/**
 * Renders a profile as a ROS `camera_info` YAML document.
 *
 * The layout follows what `camera_calibration_parsers` writes, key for key and in the same order, so
 * the file reads like one ROS produced. The projection matrix is the calibration matrix with a zero
 * fourth column, which is what a monocular camera with no rectification has; binning and region of
 * interest are left out, as ROS treats them as optional.
 *
 * Strings in the extra mapping are always double-quoted. A timestamp left plain is read as a date
 * by YAML 1.1 readers such as PyYAML, and an id made only of digits as a number.
 */
export function serializeCameraInfoYaml(profile: CameraIntrinsicProfileV1): string {
  const {fx, fy, cx, cy, skew} = profile.intrinsics;
  const {model, coefficients} = rosDistortion(profile);
  const lines = [
    `image_width: ${profile.image.width}`,
    `image_height: ${profile.image.height}`,
    `camera_name: ${plainOrQuoted(profile.cameraId)}`,
    ...matrix('camera_matrix', 3, 3, [fx, skew, cx, 0, fy, cy, 0, 0, 1]),
    `distortion_model: ${model}`,
    ...matrix('distortion_coefficients', 1, coefficients.length, coefficients),
    ...matrix('rectification_matrix', 3, 3, [1, 0, 0, 0, 1, 0, 0, 0, 1]),
    ...matrix('projection_matrix', 3, 4, [fx, skew, cx, 0, 0, fy, cy, 0, 0, 0, 1, 0]),
    `${CAMERA_INFO_EXTENSION_KEY}:`,
    `  schema: ${quoted(profile.schema)}`,
    `  version: ${profile.version}`,
    `  profileId: ${quoted(profile.profileId)}`,
    `  calibratedAt: ${quoted(profile.calibratedAt)}`,
    `  producer: ${quoted(profile.producer)}`,
    `  undistorted: ${profile.image.undistorted}`
  ];
  const capture = profile.capture;
  if (capture !== undefined) {
    lines.push('  capture:');
    if (Object.keys(capture).length === 0) lines[lines.length - 1] += ' {}';
    appendMember(lines, 'frameRate', capture.frameRate);
    appendMember(lines, 'facingMode', capture.facingMode);
    appendMember(lines, 'resizeMode', capture.resizeMode);
    appendMember(lines, 'zoom', capture.zoom);
    appendMember(lines, 'focusMode', capture.focusMode);
    appendMember(lines, 'focusDistance', capture.focusDistance);
  }
  if (profile.quality !== undefined) {
    lines.push('  quality:');
    appendMember(lines, 'sampleCount', profile.quality.sampleCount);
    appendMember(lines, 'reprojectionErrorPx', profile.quality.reprojectionErrorPx);
  }
  if (profile.device !== undefined) {
    lines.push('  device:');
    if (Object.keys(profile.device).length === 0) lines[lines.length - 1] += ' {}';
    appendMember(lines, 'label', profile.device.label);
    appendMember(lines, 'deviceId', profile.device.deviceId);
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Turns a ROS `camera_info` YAML document into a profile document, ready to be validated.
 *
 * Only the shape ROS defines is checked here -- matrix sizes, the fixed entries of the calibration
 * matrix, a rectification that does nothing, a distortion model ROS names. Everything the profile
 * contract says about the values themselves is left to the profile validator, so there is one
 * place that decides whether a calibration is acceptable.
 */
export function readCameraInfoYaml(text: string): CameraInfoReadResult {
  let parsed: YamlValue;
  try {
    parsed = parseYaml(text);
  } catch (error) {
    if (error instanceof YamlError) {
      return {ok: false, error: {code: 'not-an-object', path: '', message: `The profile is not valid YAML. ${error.message}`}};
    }
    throw error;
  }
  try {
    return {ok: true, document: toProfileDocument(parsed)};
  } catch (error) {
    if (error instanceof CameraInfoRejection) return {ok: false, error: error.detail};
    throw error;
  }
}

function toProfileDocument(parsed: YamlValue): Record<string, unknown> {
  const root = record(parsed, '');
  for (const key of Object.keys(root)) {
    if (!ROOT_KEYS.has(key)) refuse('unexpected-field', key, 'Unknown member.');
  }
  readBinningAndRoi(root);
  const width = root['image_width'];
  const height = root['image_height'];
  if (width === undefined) refuse('missing-field', 'image_width', 'Required member is missing.');
  if (height === undefined) refuse('missing-field', 'image_height', 'Required member is missing.');

  const k = readMatrix(root, 'camera_matrix', 3, 3);
  expectEntries(k, 'camera_matrix', [
    [3, 0],
    [6, 0],
    [7, 0],
    [8, 1]
  ]);

  if ('rectification_matrix' in root) {
    const r = readMatrix(root, 'rectification_matrix', 3, 3);
    expectEntries(
      r,
      'rectification_matrix',
      [1, 0, 0, 0, 1, 0, 0, 0, 1].map((value, index) => [index, value] as [number, number]),
      'A rectification other than identity belongs to a stereo pair, not to one camera\'s intrinsics.'
    );
  }
  if ('projection_matrix' in root) readMatrix(root, 'projection_matrix', 3, 4);

  const distortion = readDistortion(root);
  const extension = root[CAMERA_INFO_EXTENSION_KEY];
  if (extension === undefined) {
    refuse(
      'missing-field',
      CAMERA_INFO_EXTENSION_KEY,
      'The file is a ROS camera_info document without the calibration record: when it was calibrated and under which camera settings are not known.'
    );
  }
  const extra = record(extension, CAMERA_INFO_EXTENSION_KEY);
  const known = new Set(['schema', 'version', 'profileId', 'calibratedAt', 'producer', 'undistorted', 'capture', 'quality', 'device']);
  for (const key of Object.keys(extra)) {
    if (!known.has(key)) refuse('unexpected-field', `${CAMERA_INFO_EXTENSION_KEY}.${key}`, 'Unknown member.');
  }
  if (extra['schema'] !== CAMERA_INTRINSIC_PROFILE_SCHEMA) {
    refuse('unsupported-schema', `${CAMERA_INFO_EXTENSION_KEY}.schema`, `Expected ${JSON.stringify(CAMERA_INTRINSIC_PROFILE_SCHEMA)}.`);
  }
  if (extra['version'] !== CAMERA_INTRINSIC_PROFILE_VERSION) {
    refuse('unsupported-version', `${CAMERA_INFO_EXTENSION_KEY}.version`, `Expected ${CAMERA_INTRINSIC_PROFILE_VERSION}.`);
  }

  const undistorted = extra['undistorted'] ?? false;
  return {
    schema: CAMERA_INTRINSIC_PROFILE_SCHEMA,
    version: CAMERA_INTRINSIC_PROFILE_VERSION,
    profileId: extra['profileId'],
    cameraId: root['camera_name'],
    calibratedAt: extra['calibratedAt'],
    producer: extra['producer'],
    cameraModel: 'pinhole',
    image: {width, height, undistorted},
    intrinsics: {fx: k[0], fy: k[4], cx: k[2], cy: k[5], skew: k[1]},
    distortion,
    ...('capture' in extra ? {capture: extra['capture']} : {}),
    ...('quality' in extra ? {quality: extra['quality']} : {}),
    ...('device' in extra ? {device: extra['device']} : {})
  };
}

/**
 * Maps a ROS distortion model onto the profile's.
 *
 * `plumb_bob` coefficients that are all zero read as no distortion. ROS has no model for "none"; a
 * lens-free image is written as plumb_bob with five zeros, and reading it back must not invent a
 * Brown-Conrady lens that happens to do nothing.
 */
function readDistortion(root: Record<string, YamlValue>): {model: DistortionModel; coefficients: number[]} {
  const rawModel = root['distortion_model'] ?? PLUMB_BOB;
  const coefficients = readMatrix(root, 'distortion_coefficients', 1, undefined);
  switch (rawModel) {
    case PLUMB_BOB:
      if (coefficients.length !== 4 && coefficients.length !== 5) {
        refuse('invalid-distortion', 'distortion_coefficients', `plumb_bob takes 5 coefficients, not ${coefficients.length}.`);
      }
      return isAllZero(coefficients) ? {model: 'none', coefficients: []} : {model: 'brown-conrady', coefficients};
    case RATIONAL_POLYNOMIAL:
      if (coefficients.length !== 8) {
        refuse('invalid-distortion', 'distortion_coefficients', `rational_polynomial takes 8 coefficients, not ${coefficients.length}.`);
      }
      return {model: 'brown-conrady', coefficients};
    case EQUIDISTANT:
      if (coefficients.length !== 4) {
        refuse('invalid-distortion', 'distortion_coefficients', `equidistant takes 4 coefficients, not ${coefficients.length}.`);
      }
      return {model: 'kannala-brandt', coefficients};
    default:
      refuse('invalid-distortion', 'distortion_model', `Expected ${PLUMB_BOB}, ${RATIONAL_POLYNOMIAL} or ${EQUIDISTANT}.`);
  }
}

/**
 * Binning and a region of interest change which pixels the calibration describes. ROS writes both
 * with their do-nothing values, and only those are accepted: a calibration of a binned or cropped
 * image is a different calibration, and reading it as the full frame's would move the principal
 * point without anyone noticing.
 */
function readBinningAndRoi(root: Record<string, YamlValue>): void {
  for (const name of ['binning_x', 'binning_y']) {
    const value = root[name];
    if (value !== undefined && value !== 0 && value !== 1) {
      refuse('inconsistent-profile', name, 'A binned image is not the image the calibration describes.');
    }
  }
  const roi = root['roi'];
  if (roi === undefined) return;
  const region = record(roi, 'roi');
  const width = region['width'] ?? 0;
  const height = region['height'] ?? 0;
  const offsetX = region['x_offset'] ?? 0;
  const offsetY = region['y_offset'] ?? 0;
  const whole = width === 0 && height === 0;
  const full = width === root['image_width'] && height === root['image_height'];
  if (offsetX !== 0 || offsetY !== 0 || !(whole || full)) {
    refuse('inconsistent-profile', 'roi', 'A region of interest is not the image the calibration describes.');
  }
}

function rosDistortion(profile: CameraIntrinsicProfileV1): {model: string; coefficients: number[]} {
  const coefficients = [...profile.distortion.coefficients];
  switch (profile.distortion.model) {
    case 'none':
      return {model: PLUMB_BOB, coefficients: [0, 0, 0, 0, 0]};
    case 'kannala-brandt':
      return {model: EQUIDISTANT, coefficients};
    case 'brown-conrady':
      if (coefficients.length === 8) return {model: RATIONAL_POLYNOMIAL, coefficients};
      // ROS readers expect k3 to be present; a four-term Brown-Conrady lens has k3 = 0.
      return {model: PLUMB_BOB, coefficients: coefficients.length === 4 ? [...coefficients, 0] : coefficients};
  }
}

function readMatrix(root: Record<string, YamlValue>, name: string, rows: number, cols: number | undefined): number[] {
  const value = root[name];
  if (value === undefined) refuse('missing-field', name, 'Required member is missing.');
  const matrix = record(value, name);
  const declaredRows = matrix['rows'];
  const declaredCols = matrix['cols'];
  const data = matrix['data'];
  if (declaredRows !== rows) refuse('invalid-value', `${name}.rows`, `Expected ${rows}.`);
  if (cols !== undefined && declaredCols !== cols) refuse('invalid-value', `${name}.cols`, `Expected ${cols}.`);
  if (typeof declaredCols !== 'number' || !Number.isInteger(declaredCols) || declaredCols < 0) {
    refuse('invalid-value', `${name}.cols`, 'Expected a column count.');
  }
  if (!Array.isArray(data)) refuse('invalid-type', `${name}.data`, 'Expected a sequence of numbers.');
  if (data.length !== rows * declaredCols) {
    refuse('invalid-value', `${name}.data`, `Expected ${rows * declaredCols} numbers for a ${rows}x${declaredCols} matrix, not ${data.length}.`);
  }
  return data.map((entry, index) => {
    if (typeof entry !== 'number' || !Number.isFinite(entry)) {
      refuse('invalid-type', `${name}.data[${index}]`, 'Expected a number.');
    }
    return entry;
  });
}

function expectEntries(
  data: readonly number[],
  name: string,
  entries: ReadonlyArray<[number, number]>,
  message?: string
): void {
  for (const [index, expected] of entries) {
    if (Math.abs(data[index]! - expected) > MATRIX_TOLERANCE) {
      refuse('inconsistent-profile', `${name}.data[${index}]`, message ?? `Expected ${expected}; the value read as ${data[index]}.`);
    }
  }
}

function record(value: YamlValue | undefined, path: string): Record<string, YamlValue> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    refuse('not-an-object', path, 'Expected a mapping.');
  }
  return value;
}

function isAllZero(values: readonly number[]): boolean {
  return values.every((value) => value === 0);
}

function matrix(name: string, rows: number, cols: number, data: readonly number[]): string[] {
  return [`${name}:`, `  rows: ${rows}`, `  cols: ${cols}`, `  data: [${data.map(number).join(', ')}]`];
}

/** Numbers as JavaScript writes them, which is the shortest text that reads back to the same value. */
function number(value: number): string {
  return Object.is(value, -0) ? '0' : String(value);
}

function quoted(text: string): string {
  return JSON.stringify(text);
}

/** Camera names are identifiers and read the same plain, which is how ROS writes them. */
function plainOrQuoted(text: string): string {
  return /^[A-Za-z][A-Za-z0-9._-]*$/.test(text) && !/^(?:true|false|null|yes|no|on|off|y|n)$/i.test(text) ? text : quoted(text);
}

function appendMember(lines: string[], name: string, value: string | number | undefined): void {
  if (value === undefined) return;
  lines.push(`    ${name}: ${typeof value === 'string' ? quoted(value) : number(value)}`);
}

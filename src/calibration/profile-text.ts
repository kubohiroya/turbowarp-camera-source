/**
 * Profile text as an operator hands it over: a ROS `camera_info` YAML file, or profile JSON.
 *
 * The operator does not know which one a file is and should not have to. JSON always starts with a
 * brace; a calibration YAML file never does, because its top level is a block mapping. That one
 * character decides, and each branch names what it expected when the text is not what it looked
 * like.
 */
import {readCameraInfoYaml} from './camera-info.js';
import type {ProfileError} from './types.js';

export type ProfileTextResult =
  | {readonly ok: true; readonly document: unknown}
  | {readonly ok: false; readonly error: ProfileError};

export function readProfileText(text: string): ProfileTextResult {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return {ok: false, error: {code: 'not-an-object', path: '', message: 'The profile is empty.'}};
  }
  if (trimmed.startsWith('{')) {
    try {
      return {ok: true, document: JSON.parse(trimmed)};
    } catch {
      return {ok: false, error: {code: 'not-an-object', path: '', message: 'The profile is not valid JSON.'}};
    }
  }
  return readCameraInfoYaml(trimmed);
}

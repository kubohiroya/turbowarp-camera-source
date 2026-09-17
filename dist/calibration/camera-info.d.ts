import type { CameraIntrinsicProfileV1, ProfileError } from './types.js';
/** The top-level key holding the members ROS has no place for. */
export declare const CAMERA_INFO_EXTENSION_KEY = "turbowarp_camera_source";
export type CameraInfoReadResult = {
    readonly ok: true;
    readonly document: Record<string, unknown>;
} | {
    readonly ok: false;
    readonly error: ProfileError;
};
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
export declare function serializeCameraInfoYaml(profile: CameraIntrinsicProfileV1): string;
/**
 * Turns a ROS `camera_info` YAML document into a profile document, ready to be validated.
 *
 * Only the shape ROS defines is checked here -- matrix sizes, the fixed entries of the calibration
 * matrix, a rectification that does nothing, a distortion model ROS names. Everything the profile
 * contract says about the values themselves is left to the profile validator, so there is one
 * place that decides whether a calibration is acceptable.
 */
export declare function readCameraInfoYaml(text: string): CameraInfoReadResult;
//# sourceMappingURL=camera-info.d.ts.map
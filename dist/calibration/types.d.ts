/**
 * The intrinsic calibration profile contract.
 *
 * A profile describes how one camera projects the world onto its own captured image. It says nothing
 * about where that camera stands: the pose of a camera in a shared world frame belongs to whichever
 * extension solves placement, and mixing the two into one document is what made the earlier
 * `twrmc/camera-calibration` format unusable for anything but the application it came from.
 *
 * Camera Source owns the contract but never produces a profile. Chessboard calibration, an operator
 * supplying JSON, or a future calibrator are all just producers of a document that passes validation.
 */
/** Projection model of the lens. Version 1 defines the pinhole model only. */
export type CameraModel = 'pinhole';
/**
 * Lens distortion model.
 *
 * `brown-conrady` carries the OpenCV radial and tangential coefficients in their usual order
 * (k1, k2, p1, p2 with optional k3, and k4-k6 for the rational model). `kannala-brandt` carries the
 * four fisheye coefficients. `none` means the image is free of lens distortion.
 */
export type DistortionModel = 'none' | 'brown-conrady' | 'kannala-brandt';
/**
 * The pinhole parameters, in pixels of the calibration image.
 *
 * Named rather than packed into a matrix because a nine-number array cannot say whether it is stored
 * row-major or column-major, and a reader that guesses wrong produces a plausible, wrong projection.
 * The equivalent row-major 3x3 matrix is `[fx, skew, cx, 0, fy, cy, 0, 0, 1]`.
 *
 * Pixel coordinates run from the top-left corner of the image, x to the right and y downward.
 */
export interface CameraIntrinsics {
    readonly fx: number;
    readonly fy: number;
    readonly cx: number;
    readonly cy: number;
    /** Axis skew. Zero for every square-pixel sensor; kept explicit so it is never assumed. */
    readonly skew: number;
}
export interface CameraDistortion {
    readonly model: DistortionModel;
    readonly coefficients: readonly number[];
}
/**
 * The image the calibration was solved against.
 *
 * `undistorted` is false for the base contract: a profile describes the raw captured frame, and a
 * consumer applies the distortion model itself. A producer that hands over already corrected images
 * sets it to true, which then requires the intrinsics to describe the corrected image and forbids
 * leftover distortion coefficients.
 *
 * The image is always the camera's own capture. Preview mirroring is a display choice made by
 * whoever shows the frame and never changes the calibration.
 */
export interface CalibrationImage {
    readonly width: number;
    readonly height: number;
    readonly undistorted: boolean;
}
/**
 * How good the calibration is.
 *
 * Optional, because a profile can arrive from a producer that does not report it — an operator's
 * hand-written JSON, or the legacy format, which carried no quality fields at all. Absent means
 * unknown. A consumer that needs a quality bound must treat absence as unknown and say so, rather
 * than reading it as a measured zero.
 */
export interface CalibrationQuality {
    readonly sampleCount: number;
    readonly reprojectionErrorPx: number;
}
/**
 * Hints for recognizing the physical camera again.
 *
 * `deviceId` is a hint and not an identity: browsers scope it per origin and per profile, so it
 * changes without the camera changing. Matching is done on the operator-assigned `cameraId`.
 */
export interface CalibrationDeviceHint {
    readonly label?: string;
    readonly deviceId?: string;
}
/**
 * The capture configuration the calibration was solved under.
 *
 * Optional as a whole, and optional member by member, but the difference between the two matters.
 * When the block is absent nothing was recorded and compatibility cannot be decided. When it is
 * present, a member that is absent means the device reported no such control at calibration time,
 * which is something a later check can compare against.
 *
 * `frameRate` and `facingMode` are recorded for the operator; neither changes how the lens projects,
 * so neither decides compatibility.
 */
export interface CalibrationCapture {
    readonly frameRate?: number;
    readonly facingMode?: string;
    /** `none` or `crop-and-scale`. Cropping changes the effective intrinsics at the same resolution. */
    readonly resizeMode?: string;
    readonly zoom?: number;
    /** `none`, `manual`, `single-shot` or `continuous`. */
    readonly focusMode?: string;
    readonly focusDistance?: number;
}
export interface CameraIntrinsicProfileV1 {
    readonly schema: 'twcs/camera-intrinsics';
    readonly version: 1;
    /** Identifies this calibration run. A new solve produces a new id. */
    readonly profileId: string;
    /** The operator-assigned camera name, such as `stage-left`. Stable across calibration runs. */
    readonly cameraId: string;
    /** When the calibration was solved, as an RFC 3339 timestamp in UTC. */
    readonly calibratedAt: string;
    /** Free text naming whatever produced the profile. Recorded for diagnostics only. */
    readonly producer: string;
    readonly cameraModel: CameraModel;
    readonly image: CalibrationImage;
    readonly intrinsics: CameraIntrinsics;
    readonly distortion: CameraDistortion;
    readonly capture?: CalibrationCapture;
    readonly quality?: CalibrationQuality;
    readonly device?: CalibrationDeviceHint;
}
export type ProfileErrorCode = 'not-an-object' | 'unsupported-schema' | 'unsupported-version' | 'missing-field' | 'unexpected-field' | 'invalid-type' | 'invalid-value' | 'out-of-range' | 'invalid-distortion' | 'inconsistent-profile' | 'forbidden-field';
export interface ProfileError {
    readonly code: ProfileErrorCode;
    /** Dotted path to the offending member, or an empty string for the document itself. */
    readonly path: string;
    readonly message: string;
}
export type ProfileResult = {
    readonly ok: true;
    readonly profile: CameraIntrinsicProfileV1;
} | {
    readonly ok: false;
    readonly error: ProfileError;
};
//# sourceMappingURL=types.d.ts.map
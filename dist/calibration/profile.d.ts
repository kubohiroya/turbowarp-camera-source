/**
 * Validation and normalization for intrinsic calibration profiles.
 *
 * The validator is hand-written and pulls in no runtime dependency, which is what keeps the shipped
 * bundle small enough that every extension needing a camera can afford to load it. The published
 * JSON Schema in `schemas/` is the same contract written for outside readers, and a test checks the
 * two against one set of fixtures so they cannot drift apart.
 *
 * Everything here is fail-closed. A document that is not understood is rejected with a reason;
 * nothing is repaired, defaulted, or partially accepted, because a profile that is silently patched
 * produces a projection that looks reasonable and is wrong.
 */
import type { CameraIntrinsicProfileV1, ProfileResult } from './types.js';
export declare const CAMERA_INTRINSIC_PROFILE_SCHEMA = "twcs/camera-intrinsics";
export declare const CAMERA_INTRINSIC_PROFILE_VERSION = 1;
/** The application-specific format this contract replaces. Read for migration, never written. */
export declare const LEGACY_CALIBRATION_SCHEMA = "twrmc/camera-calibration";
/**
 * Reads whichever profile format a document is written in.
 *
 * An operator holding a file does not know, and should not have to know, which of two schemas it
 * uses; they know they calibrated this camera once and kept the result. Dispatching on the document
 * itself means one entry point accepts both, and the profile that comes out records where it came
 * from in `producer`, so nothing about the conversion is hidden.
 *
 * Only the declared schema decides. A document that says nothing recognizable is refused by the
 * current parser, which names what it expected.
 */
export declare function readCameraProfileDocument(input: unknown): ProfileResult;
/** Validates a parsed document and returns a normalized profile, or the reason it was refused. */
export declare function parseCameraIntrinsicProfile(input: unknown): ProfileResult;
/** Validates profile JSON. Text that is not JSON at all is refused like any other invalid input. */
export declare function parseCameraIntrinsicProfileJson(text: string): ProfileResult;
export declare function serializeCameraIntrinsicProfile(profile: CameraIntrinsicProfileV1): string;
/**
 * Converts a `twrmc/camera-calibration` v1 document into this contract.
 *
 * The world pose the old format carried is deliberately dropped. It was the extrinsic of whichever
 * calibration sample happened to be last, so treating it as a placement in a shared world frame puts
 * a camera somewhere it has never been. Placement belongs to whoever solves it against a common
 * reference, and a profile that simply lacks it is honest about what it knows.
 *
 * Quality is dropped for the same reason: the old format recorded none, and inventing a sample count
 * or a reprojection error would turn "unknown" into a measurement.
 */
export declare function adoptLegacyCameraCalibration(input: unknown): ProfileResult;
//# sourceMappingURL=profile.d.ts.map
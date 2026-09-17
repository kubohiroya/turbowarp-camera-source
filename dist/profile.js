/**
 * The profile contract as functions, for code that runs outside TurboWarp.
 *
 * `./runtime` names what another extension talks to at run time and deliberately carries no logic.
 * This entry is the other half: reading and writing a calibration file, validating a document, and
 * deciding whether a profile fits a camera, as plain functions over plain values. A test that checks
 * a file a calibration app wrote, or a tool that prepares one, imports these instead of copying the
 * rules -- a copy is checked against nothing, and the day the contract moved it would go on agreeing
 * with itself.
 *
 * Nothing here touches a camera, a document, or the VM.
 */
export { CAMERA_INFO_EXTENSION_KEY, readCameraInfoYaml, serializeCameraInfoYaml } from './calibration/camera-info.js';
export { readProfileText } from './calibration/profile-text.js';
export { CAMERA_INTRINSIC_PROFILE_SCHEMA, CAMERA_INTRINSIC_PROFILE_VERSION, readCameraProfileDocument, serializeCameraIntrinsicProfile } from './calibration/profile.js';
export { evaluateProfileCompatibility } from './calibration/compatibility.js';
export { readCameraConditions } from './calibration/conditions.js';
//# sourceMappingURL=profile.js.map
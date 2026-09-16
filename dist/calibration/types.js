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
export {};
//# sourceMappingURL=types.js.map
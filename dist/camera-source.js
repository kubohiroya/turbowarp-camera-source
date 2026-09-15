// Name: Camera Source
// ID: kubohiroyacamerasource
// Description: Share one MediaDevices camera stream between TurboWarp extensions.
// By: Hiroya Kubo
// License: MPL-2.0

(function (Scratch) {
  'use strict';

  //#region src/config.ts
  var extensionConfig = {
  	id: "kubohiroyacamerasource",
  	slug: "camera-source",
  	name: "Camera Source",
  	description: "Share one MediaDevices camera stream between TurboWarp extensions.",
  	author: "Hiroya Kubo",
  	license: "MPL-2.0",
  	unsandboxed: true
  };
  //#endregion
  //#region config/feature-flags.ts
  var overrides = globalThis.__TWCS_FEATURE_FLAGS__;
  var featureFlags = Object.freeze({ calibrationProfilesV1: overrides?.calibrationProfilesV1 === true });
  var block_definitions_default = {
  	extensionName: "Camera Source",
  	blocks: [
  		{
  			"opcode": "startSharedCamera",
  			"blockType": "COMMAND",
  			"text": "start shared camera [CAMERA_ID] with device ID [DEVICE_ID]",
  			"description": "Starts or keeps a named shared MediaDevices camera stream.",
  			"arguments": {
  				"CAMERA_ID": {
  					"type": "STRING",
  					"defaultValue": "default"
  				},
  				"DEVICE_ID": {
  					"type": "STRING",
  					"defaultValue": ""
  				}
  			}
  		},
  		{
  			"opcode": "stopSharedCamera",
  			"blockType": "COMMAND",
  			"text": "stop shared camera [CAMERA_ID]",
  			"description": "Stops a named shared camera stream and releases its tracks.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "isCameraRunning",
  			"blockType": "BOOLEAN",
  			"text": "shared camera [CAMERA_ID] is running?",
  			"description": "Reports whether a named shared camera stream is active.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraErrorCode",
  			"blockType": "REPORTER",
  			"text": "shared camera [CAMERA_ID] error code",
  			"description": "Returns the latest camera failure code, or an empty string after a successful start.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraError",
  			"blockType": "REPORTER",
  			"text": "shared camera [CAMERA_ID] error",
  			"description": "Returns the latest camera failure message, or an empty string after a successful start.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraDeviceIdReporter",
  			"blockType": "REPORTER",
  			"text": "shared camera [CAMERA_ID] device ID",
  			"description": "Returns the active device ID for a named shared camera when available.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "showCameraPreview",
  			"blockType": "COMMAND",
  			"text": "show shared camera [CAMERA_ID] preview mirrored [MIRRORED]",
  			"description": "Shows the named shared camera with the GPU-backed stage preview.",
  			"arguments": {
  				"CAMERA_ID": {
  					"type": "STRING",
  					"defaultValue": "default"
  				},
  				"MIRRORED": {
  					"type": "STRING",
  					"defaultValue": "true"
  				}
  			}
  		},
  		{
  			"opcode": "hideCameraPreview",
  			"blockType": "COMMAND",
  			"text": "hide shared camera [CAMERA_ID] preview",
  			"description": "Hides the block-owned preview without stopping leases owned by other consumers.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraFrameWidth",
  			"blockType": "REPORTER",
  			"text": "shared camera [CAMERA_ID] frame width",
  			"description": "Returns the active video frame width in pixels, or zero while the camera is not running.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraFrameHeight",
  			"blockType": "REPORTER",
  			"text": "shared camera [CAMERA_ID] frame height",
  			"description": "Returns the active video frame height in pixels, or zero while the camera is not running.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraFrameRate",
  			"blockType": "REPORTER",
  			"text": "shared camera [CAMERA_ID] frame rate",
  			"description": "Returns the active video track frame rate, or zero when it is unavailable.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "refreshCameraDevices",
  			"blockType": "COMMAND",
  			"text": "refresh camera devices",
  			"description": "Refreshes the browser camera device list.",
  			"arguments": {}
  		},
  		{
  			"opcode": "cameraDeviceCount",
  			"blockType": "REPORTER",
  			"text": "camera device count",
  			"description": "Returns the number of known camera devices after refresh.",
  			"arguments": {}
  		},
  		{
  			"opcode": "cameraDeviceIdAt",
  			"blockType": "REPORTER",
  			"text": "camera device ID at [INDEX]",
  			"description": "Returns the one-based camera device ID at the requested index.",
  			"arguments": { "INDEX": {
  				"type": "STRING",
  				"defaultValue": "1"
  			} }
  		},
  		{
  			"opcode": "cameraDeviceLabelAt",
  			"blockType": "REPORTER",
  			"text": "camera device label at [INDEX]",
  			"description": "Returns the one-based camera device label at the requested index when the browser exposes it.",
  			"arguments": { "INDEX": {
  				"type": "STRING",
  				"defaultValue": "1"
  			} }
  		},
  		{
  			"opcode": "registerCameraProfile",
  			"feature": "calibrationProfilesV1",
  			"blockType": "COMMAND",
  			"text": "register camera profile [PROFILE_JSON]",
  			"description": "Validates a twcs/camera-intrinsics version 1 document and stores it against the camera it names. Nothing is stored unless the whole document passes, and the profile in force for that camera is replaced.",
  			"arguments": { "PROFILE_JSON": {
  				"type": "STRING",
  				"defaultValue": "{}"
  			} }
  		},
  		{
  			"opcode": "forgetCameraProfile",
  			"feature": "calibrationProfilesV1",
  			"blockType": "COMMAND",
  			"text": "forget camera profile for [CAMERA_ID]",
  			"description": "Removes the stored calibration profile for one camera.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraProfileRegistered",
  			"feature": "calibrationProfilesV1",
  			"blockType": "BOOLEAN",
  			"text": "camera [CAMERA_ID] is calibrated?",
  			"description": "Reports whether a calibration profile is stored for the camera. An uncalibrated camera is an ordinary state and not an error.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraProfileJson",
  			"feature": "calibrationProfilesV1",
  			"blockType": "REPORTER",
  			"text": "camera profile JSON for [CAMERA_ID]",
  			"description": "Returns the stored profile as JSON, or an empty string when the camera has none.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraProfileError",
  			"feature": "calibrationProfilesV1",
  			"blockType": "REPORTER",
  			"text": "camera profile error",
  			"description": "Returns the code of the last rejected profile document, or an empty string when the last one was accepted.",
  			"arguments": {}
  		},
  		{
  			"opcode": "cameraProfileErrorDetail",
  			"feature": "calibrationProfilesV1",
  			"blockType": "REPORTER",
  			"text": "camera profile error detail",
  			"description": "Returns why the last profile document was rejected, naming the member at fault.",
  			"arguments": {}
  		},
  		{
  			"opcode": "cameraProfileCompatibility",
  			"feature": "calibrationProfilesV1",
  			"blockType": "REPORTER",
  			"text": "camera profile compatibility for [CAMERA_ID]",
  			"description": "Returns compatible, incompatible, undetermined, or an empty string when the camera has no profile. Undetermined is a distinct answer from compatible and never resolves upward into it.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraProfileCompatibilityDetail",
  			"feature": "calibrationProfilesV1",
  			"blockType": "REPORTER",
  			"text": "camera profile compatibility detail for [CAMERA_ID]",
  			"description": "Returns the findings that decided the verdict, so an operator sees the one thing that has to change.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraProfileAdaptation",
  			"feature": "calibrationProfilesV1",
  			"blockType": "REPORTER",
  			"text": "camera profile adaptation for [CAMERA_ID]",
  			"description": "Returns exact, scaled, or unavailable. A frame size that differs by a pure scale can be projected with scaled intrinsics; a crop or an aspect change cannot, because the principal point cannot be placed.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraProfileIntrinsicsJson",
  			"feature": "calibrationProfilesV1",
  			"blockType": "REPORTER",
  			"text": "camera intrinsics JSON for [CAMERA_ID]",
  			"description": "Returns the intrinsics to project the current frames with, already adapted to the frame size, or an empty string when they cannot be established. Consumers use this rather than scaling a profile themselves, because only this extension can tell a scale from a crop.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraConditionsJson",
  			"feature": "calibrationProfilesV1",
  			"blockType": "REPORTER",
  			"text": "camera conditions JSON for [CAMERA_ID]",
  			"description": "Returns what the track reports about itself: frame size, resize mode, zoom, focus and frame rate. Read only; this extension never changes a shared camera configuration.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraConditionsGeneration",
  			"feature": "calibrationProfilesV1",
  			"blockType": "REPORTER",
  			"text": "camera conditions generation for [CAMERA_ID]",
  			"description": "Returns a number that increases whenever something affecting the geometry changes. A consumer holding a derived result compares this instead of re-checking every condition.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		}
  	]
  };
  //#endregion
  //#region src/calibration/conditions.ts
  function positiveNumber(value) {
  	return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : void 0;
  }
  function nonNegativeNumber(value) {
  	return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : void 0;
  }
  function nonEmptyText(value) {
  	if (typeof value !== "string") return void 0;
  	const text = value.trim();
  	return text.length === 0 ? void 0 : text;
  }
  function pixelCount(value) {
  	return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
  }
  /**
  * Builds the conditions record.
  *
  * Frame size comes from the delivered frame rather than from the track settings: a track can report
  * a requested size that the browser then satisfies with something else, and the number a consumer
  * has to match its intrinsics against is the size of the image it is actually handed.
  */
  function readCameraConditions(frame, settings = {}) {
  	const label = nonEmptyText(frame.label);
  	const frameRate = positiveNumber(settings.frameRate);
  	const facingMode = nonEmptyText(settings.facingMode);
  	const resizeMode = nonEmptyText(settings.resizeMode);
  	const zoom = positiveNumber(settings.zoom);
  	const focusMode = nonEmptyText(settings.focusMode);
  	const focusDistance = nonNegativeNumber(settings.focusDistance);
  	return {
  		width: pixelCount(frame.width),
  		height: pixelCount(frame.height),
  		deviceId: nonEmptyText(frame.deviceId) ?? nonEmptyText(settings.deviceId) ?? "",
  		previewFlip: frame.previewFlip,
  		...label === void 0 ? {} : { label },
  		...frameRate === void 0 ? {} : { frameRate },
  		...facingMode === void 0 ? {} : { facingMode },
  		...resizeMode === void 0 ? {} : { resizeMode },
  		...zoom === void 0 ? {} : { zoom },
  		...focusMode === void 0 ? {} : { focusMode },
  		...focusDistance === void 0 ? {} : { focusDistance }
  	};
  }
  //#endregion
  //#region src/calibration/compatibility.ts
  /** Zoom readings are device-reported floats; compare them with a tolerance rather than exactly. */
  var ZOOM_TOLERANCE = 1e-6;
  var FOCUS_DISTANCE_TOLERANCE = 1e-6;
  function finding(code, state, decisive, detail) {
  	return {
  		code,
  		state,
  		decisive,
  		detail
  	};
  }
  function describe(value) {
  	return value === void 0 ? "not reported" : String(value);
  }
  /**
  * Compares one optical member.
  *
  * Absent on both sides is agreement, not ignorance: the device reported no such control when the
  * calibration was solved and reports none now. Present on one side only is a change nobody can
  * quantify, so it is left unknown rather than guessed in either direction.
  */
  function compareMember(code, name, recorded, observed, equal) {
  	if (recorded === void 0 && observed === void 0) return finding(code, "matched", true, `Neither the profile nor the camera reports ${name}.`);
  	if (recorded === void 0 || observed === void 0) return finding(code, "unknown", true, `${name} is ${describe(recorded)} in the profile and ${describe(observed)} now, so the two cannot be compared.`);
  	const same = equal(recorded, observed);
  	return finding(code, same ? "matched" : "mismatched", true, same ? `${name} is ${describe(observed)} in both.` : `${name} was ${describe(recorded)} at calibration and is ${describe(observed)} now.`);
  }
  var sameText = (left, right) => left === right;
  var nearlyEqual = (tolerance) => (left, right) => Math.abs(left - right) <= tolerance;
  function captureFindings(capture, conditions) {
  	return [
  		compareMember("resize-mode", "Resize mode", capture.resizeMode, conditions.resizeMode, sameText),
  		compareMember("zoom", "Zoom", capture.zoom, conditions.zoom, nearlyEqual(ZOOM_TOLERANCE)),
  		compareMember("focus-mode", "Focus mode", capture.focusMode, conditions.focusMode, sameText),
  		compareMember("focus-distance", "Focus distance", capture.focusDistance, conditions.focusDistance, nearlyEqual(FOCUS_DISTANCE_TOLERANCE))
  	];
  }
  function imageSizeFinding(profile, conditions) {
  	const expected = `${profile.image.width}x${profile.image.height}`;
  	if (conditions.width === 0 || conditions.height === 0) return finding("image-size", "unknown", true, `The camera has delivered no frame yet, so its size cannot be compared with the calibrated ${expected}.`);
  	const actual = `${conditions.width}x${conditions.height}`;
  	return actual === expected ? finding("image-size", "matched", true, `The frame is ${actual}, as calibrated.`) : finding("image-size", "mismatched", true, `The calibration was solved at ${expected} and the camera now delivers ${actual}.`);
  }
  function deviceFindings(profile, conditions) {
  	const recordedLabel = profile.device?.label;
  	const observedLabel = conditions.label;
  	const label = recordedLabel !== void 0 && observedLabel !== void 0 ? finding("device-label", recordedLabel === observedLabel ? "matched" : "mismatched", true, recordedLabel === observedLabel ? `The camera still reports itself as ${observedLabel}.` : `The profile was solved on ${recordedLabel} and the camera now reports ${observedLabel}.`) : finding("device-label", "unknown", false, "A device label is missing on one side, which is normal before the browser grants camera permission.");
  	const recordedId = profile.device?.deviceId;
  	const observedId = conditions.deviceId.length === 0 ? void 0 : conditions.deviceId;
  	return [label, finding("device-id", recordedId !== void 0 && observedId !== void 0 && recordedId === observedId ? "matched" : "unknown", false, "A device id is scoped to one browser and profile, so it changes without the camera changing. It is a hint for ordering candidates, never proof of identity.")];
  }
  /**
  * Judges a profile against the conditions a camera reports.
  *
  * The verdict is `incompatible` when any decisive finding mismatched, `undetermined` when any
  * decisive finding could not be settled, and `compatible` only when every decisive finding matched.
  * Unknown never resolves upward into `compatible`.
  */
  function evaluateProfileCompatibility(profile, conditions) {
  	const findings = [imageSizeFinding(profile, conditions)];
  	if (profile.image.undistorted) findings.push(finding("undistorted-frames", "unknown", true, "The profile describes already undistorted images. This extension hands over the camera frames as captured and cannot confirm that something upstream corrects them."));
  	if (profile.capture === void 0) findings.push(finding("capture-conditions", "unknown", true, "The profile records no capture conditions, so whether the optics are configured as they were at calibration cannot be decided."));
  	else findings.push(...captureFindings(profile.capture, conditions));
  	findings.push(finding("frame-rate", "matched", false, `Frame rate was ${describe(profile.capture?.frameRate)} at calibration and is ${describe(conditions.frameRate)} now. It does not change how the lens projects.`), finding("facing-mode", "matched", false, `Facing mode was ${describe(profile.capture?.facingMode)} at calibration and is ${describe(conditions.facingMode)} now.`), ...deviceFindings(profile, conditions));
  	const decisive = findings.filter((entry) => entry.decisive);
  	return {
  		state: decisive.some((entry) => entry.state === "mismatched") ? "incompatible" : decisive.some((entry) => entry.state === "unknown") ? "undetermined" : "compatible",
  		findings
  	};
  }
  /** The findings that decided the verdict, in the order they were made. */
  function decisiveFindings(report) {
  	return report.findings.filter((entry) => entry.decisive && entry.state !== "matched");
  }
  //#endregion
  //#region src/calibration/adaptation.ts
  /** Aspect ratios are compared with a tolerance; reported sizes are whole pixels. */
  var ASPECT_TOLERANCE = .001;
  function adaptProfileToConditions(profile, conditions) {
  	const { width: calibratedWidth, height: calibratedHeight } = profile.image;
  	const { width, height } = conditions;
  	if (width === 0 || height === 0) return {
  		state: "unavailable",
  		code: "no-frame",
  		width,
  		height,
  		scale: 1,
  		detail: "The camera has delivered no frame yet, so there is no size to adapt to."
  	};
  	if (width === calibratedWidth && height === calibratedHeight) return {
  		state: "exact",
  		code: "exact",
  		intrinsics: profile.intrinsics,
  		width,
  		height,
  		scale: 1,
  		detail: `The frame is ${width}x${height}, as calibrated.`
  	};
  	if (profile.image.undistorted) return {
  		state: "unavailable",
  		code: "undistorted-frames",
  		width,
  		height,
  		scale: 1,
  		detail: "The profile describes already undistorted images, so it cannot be re-expressed for a different frame size here."
  	};
  	if (profile.capture?.resizeMode === "crop-and-scale") return {
  		state: "unavailable",
  		code: "cropped",
  		width,
  		height,
  		scale: 1,
  		detail: "The track was calibrated with crop-and-scale resizing, so a different frame size may be a crop rather than a scale and the principal point cannot be placed."
  	};
  	const scaleX = width / calibratedWidth;
  	const scaleY = height / calibratedHeight;
  	if (Math.abs(scaleX - scaleY) > ASPECT_TOLERANCE) return {
  		state: "unavailable",
  		code: "aspect-changed",
  		width,
  		height,
  		scale: 1,
  		detail: `The calibrated ${calibratedWidth}x${calibratedHeight} and the current ${width}x${height} have different aspect ratios, so the difference is not a scale.`
  	};
  	const scale = (scaleX + scaleY) / 2;
  	return {
  		state: "scaled",
  		code: "uniform-scale",
  		intrinsics: scaleIntrinsics(profile.intrinsics, scale),
  		width,
  		height,
  		scale,
  		detail: `The calibrated ${calibratedWidth}x${calibratedHeight} has been scaled by ${scale} to the current ${width}x${height}.`
  	};
  }
  function scaleIntrinsics(intrinsics, scale) {
  	return {
  		fx: intrinsics.fx * scale,
  		fy: intrinsics.fy * scale,
  		cx: intrinsics.cx * scale,
  		cy: intrinsics.cy * scale,
  		skew: intrinsics.skew
  	};
  }
  /**
  * The intrinsics to use, if there are any.
  *
  * Both conditions have to hold, and they are different questions. Compatibility asks whether this
  * profile describes this camera as it is configured now; adaptation asks whether the numbers can be
  * expressed for the frame size in front of us. A profile can fit the camera and still have no usable
  * form — a crop, say — and it can adapt cleanly while belonging to a different camera entirely.
  *
  * Returning undefined rather than the stored numbers is the whole point. Intrinsics from another
  * configuration do not fail visibly: they project, and the geometry that comes back looks like a
  * slightly different camera pose rather than like a mistake.
  */
  function usableIntrinsics(compatibility, adaptation) {
  	if (compatibility.state !== "compatible") return void 0;
  	if (adaptation.intrinsics === void 0) return void 0;
  	return {
  		...adaptation.intrinsics,
  		width: adaptation.width,
  		height: adaptation.height,
  		scale: adaptation.scale,
  		adaptation: adaptation.state
  	};
  }
  //#endregion
  //#region src/calibration/profile.ts
  var CAMERA_INTRINSIC_PROFILE_SCHEMA = "twcs/camera-intrinsics";
  var IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;
  var UTC_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/;
  var MAXIMUM_IMAGE_EDGE = 16384;
  var MAXIMUM_PIXEL_MAGNITUDE = 1e7;
  var MAXIMUM_DISTORTION_MAGNITUDE = 1e4;
  var MAXIMUM_SAMPLE_COUNT = 1e4;
  var MAXIMUM_REPROJECTION_ERROR_PX = 1e4;
  var MAXIMUM_TEXT_LENGTH = 256;
  var MAXIMUM_FRAME_RATE = 1e3;
  var MAXIMUM_ZOOM = 1e3;
  var MAXIMUM_FOCUS_DISTANCE = 1e4;
  var MAXIMUM_SCAN_DEPTH = 16;
  var DISTORTION_MODELS = [
  	"none",
  	"brown-conrady",
  	"kannala-brandt"
  ];
  var RESIZE_MODES = ["none", "crop-and-scale"];
  var FOCUS_MODES = [
  	"none",
  	"manual",
  	"single-shot",
  	"continuous"
  ];
  /**
  * Coefficient counts each model accepts.
  *
  * The Brown-Conrady lengths are the OpenCV sets that consumers already handle: four, the usual five
  * with k3, and eight for the rational model. Longer OpenCV vectors (thin prism, tilted sensor) are
  * rejected rather than carried, because no consumer in this family implements them and a profile
  * that is accepted but only partly applied is worse than one that is refused.
  */
  var DISTORTION_COEFFICIENT_LENGTHS = {
  	none: [0],
  	"brown-conrady": [
  		4,
  		5,
  		8
  	],
  	"kannala-brandt": [4]
  };
  /**
  * Key names that carry pairing or authentication material.
  *
  * Signaling data is short-lived session state and a calibration profile is a document operators keep
  * and copy between venues. Rejecting the whole document is deliberate: a profile that reached here
  * carrying an SDP is evidence that something upstream is mixing the two, and quietly stripping the
  * key would hide that.
  */
  var FORBIDDEN_KEYS = /* @__PURE__ */ new Set([
  	"accesstoken",
  	"answer",
  	"apikey",
  	"authorization",
  	"candidate",
  	"credential",
  	"credentials",
  	"ice",
  	"icecandidate",
  	"offer",
  	"passphrase",
  	"password",
  	"secret",
  	"sdp",
  	"token"
  ]);
  var ProfileRejection = class extends Error {
  	constructor(detail) {
  		super(detail.message);
  		this.name = "ProfileRejection";
  		this.detail = detail;
  	}
  };
  function reject(code, path, message) {
  	throw new ProfileRejection({
  		code,
  		path,
  		message
  	});
  }
  function isRecord(value) {
  	return typeof value === "object" && value !== null && !Array.isArray(value);
  }
  function member(path, name) {
  	return path.length === 0 ? name : `${path}.${name}`;
  }
  /** Normalizes a key so `ICE-Candidate`, `iceCandidate` and `ice_candidate` all match one entry. */
  function comparableKey(key) {
  	return key.toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  function assertNoForbiddenKeys(value, path, depth, seen) {
  	if (depth > MAXIMUM_SCAN_DEPTH) reject("invalid-value", path, "The document is nested more deeply than a profile ever is.");
  	if (typeof value !== "object" || value === null) return;
  	if (seen.has(value)) reject("invalid-value", path, "The document contains a cycle.");
  	seen.add(value);
  	if (Array.isArray(value)) {
  		value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`, depth + 1, seen));
  		return;
  	}
  	for (const [key, child] of Object.entries(value)) {
  		if (FORBIDDEN_KEYS.has(comparableKey(key))) reject("forbidden-field", member(path, key), "Pairing and authentication material must not travel inside a calibration profile.");
  		assertNoForbiddenKeys(child, member(path, key), depth + 1, seen);
  	}
  }
  function requireRecord(value, path) {
  	if (!isRecord(value)) reject(path.length === 0 ? "not-an-object" : "invalid-type", path, "Expected an object.");
  	return value;
  }
  /** Rejects unknown members as well as missing ones, so an unrecognized field is never ignored. */
  function requireExactKeys(record, path, required, optional = []) {
  	const known = /* @__PURE__ */ new Set([...required, ...optional]);
  	for (const key of Object.keys(record)) if (!known.has(key)) reject("unexpected-field", member(path, key), "Unknown member.");
  	for (const key of required) if (!(key in record)) reject("missing-field", member(path, key), "Required member is missing.");
  }
  function requireText(value, path) {
  	if (typeof value !== "string") reject("invalid-type", path, "Expected a string.");
  	if (value.length === 0 || value.length > MAXIMUM_TEXT_LENGTH) reject("out-of-range", path, `Expected between 1 and ${MAXIMUM_TEXT_LENGTH} characters.`);
  	return value;
  }
  function requireIdentifier(value, path) {
  	const text = requireText(value, path);
  	if (!IDENTIFIER_PATTERN.test(text)) reject("invalid-value", path, "Expected letters, digits, dot, underscore, colon or hyphen.");
  	return text;
  }
  function requireUtcTimestamp(value, path) {
  	const text = requireText(value, path);
  	if (!UTC_TIMESTAMP_PATTERN.test(text) || !Number.isFinite(Date.parse(text))) reject("invalid-value", path, "Expected an RFC 3339 timestamp in UTC, such as 2026-09-15T04:05:06Z.");
  	return text;
  }
  function requireBoolean(value, path) {
  	if (typeof value !== "boolean") reject("invalid-type", path, "Expected a boolean.");
  	return value;
  }
  function requireFinite(value, path) {
  	if (typeof value !== "number") reject("invalid-type", path, "Expected a number.");
  	if (!Number.isFinite(value)) reject("invalid-value", path, "Expected a finite number.");
  	return value;
  }
  function requireInteger(value, path, minimum, maximum) {
  	const numeric = requireFinite(value, path);
  	if (!Number.isInteger(numeric)) reject("invalid-value", path, "Expected an integer.");
  	if (numeric < minimum || numeric > maximum) reject("out-of-range", path, `Expected between ${minimum} and ${maximum}.`);
  	return numeric;
  }
  function requireBounded(value, path, minimum, maximum) {
  	const numeric = requireFinite(value, path);
  	if (numeric < minimum || numeric > maximum) reject("out-of-range", path, `Expected between ${minimum} and ${maximum}.`);
  	return numeric;
  }
  function requireLiteral(value, path, expected, code) {
  	if (value !== expected) reject(code, path, `Expected ${JSON.stringify(expected)}.`);
  	return expected;
  }
  function readImage(value, path) {
  	const record = requireRecord(value, path);
  	requireExactKeys(record, path, [
  		"width",
  		"height",
  		"undistorted"
  	]);
  	return {
  		width: requireInteger(record["width"], member(path, "width"), 1, MAXIMUM_IMAGE_EDGE),
  		height: requireInteger(record["height"], member(path, "height"), 1, MAXIMUM_IMAGE_EDGE),
  		undistorted: requireBoolean(record["undistorted"], member(path, "undistorted"))
  	};
  }
  /**
  * Reads the pinhole parameters.
  *
  * The principal point is allowed to sit outside the frame — a cropped or shifted sensor puts it
  * there legitimately — but not arbitrarily far, because a principal point far outside the image is
  * the signature of values given in the wrong unit rather than of an unusual lens.
  */
  function readIntrinsics(value, path, image) {
  	const record = requireRecord(value, path);
  	requireExactKeys(record, path, [
  		"fx",
  		"fy",
  		"cx",
  		"cy",
  		"skew"
  	]);
  	return {
  		fx: requireBounded(record["fx"], member(path, "fx"), Number.MIN_VALUE, MAXIMUM_PIXEL_MAGNITUDE),
  		fy: requireBounded(record["fy"], member(path, "fy"), Number.MIN_VALUE, MAXIMUM_PIXEL_MAGNITUDE),
  		cx: requireBounded(record["cx"], member(path, "cx"), -image.width, image.width * 2),
  		cy: requireBounded(record["cy"], member(path, "cy"), -image.height, image.height * 2),
  		skew: requireBounded(record["skew"], member(path, "skew"), -1e7, MAXIMUM_PIXEL_MAGNITUDE)
  	};
  }
  function readDistortion(value, path) {
  	const record = requireRecord(value, path);
  	requireExactKeys(record, path, ["model", "coefficients"]);
  	const modelPath = member(path, "model");
  	const rawModel = record["model"];
  	if (typeof rawModel !== "string" || !DISTORTION_MODELS.includes(rawModel)) reject("invalid-distortion", modelPath, `Expected one of ${DISTORTION_MODELS.join(", ")}.`);
  	const model = rawModel;
  	const coefficientsPath = member(path, "coefficients");
  	const rawCoefficients = record["coefficients"];
  	if (!Array.isArray(rawCoefficients)) reject("invalid-type", coefficientsPath, "Expected an array.");
  	const allowed = DISTORTION_COEFFICIENT_LENGTHS[model];
  	if (!allowed.includes(rawCoefficients.length)) reject("invalid-distortion", coefficientsPath, `The ${model} model takes ${allowed.join(" or ")} coefficients, not ${rawCoefficients.length}.`);
  	return {
  		model,
  		coefficients: rawCoefficients.map((coefficient, index) => requireBounded(coefficient, `${coefficientsPath}[${index}]`, -1e4, MAXIMUM_DISTORTION_MAGNITUDE))
  	};
  }
  function requireEnum(value, path, allowed) {
  	const text = requireText(value, path);
  	if (!allowed.includes(text)) reject("invalid-value", path, `Expected one of ${allowed.join(", ")}.`);
  	return text;
  }
  function readCapture(value, path) {
  	const record = requireRecord(value, path);
  	requireExactKeys(record, path, [], [
  		"frameRate",
  		"facingMode",
  		"resizeMode",
  		"zoom",
  		"focusMode",
  		"focusDistance"
  	]);
  	const read = (name, reader) => name in record ? reader(record[name], member(path, name)) : void 0;
  	const frameRate = read("frameRate", (raw, at) => requireBounded(raw, at, Number.MIN_VALUE, MAXIMUM_FRAME_RATE));
  	const facingMode = read("facingMode", requireText);
  	const resizeMode = read("resizeMode", (raw, at) => requireEnum(raw, at, RESIZE_MODES));
  	const zoom = read("zoom", (raw, at) => requireBounded(raw, at, Number.MIN_VALUE, MAXIMUM_ZOOM));
  	const focusMode = read("focusMode", (raw, at) => requireEnum(raw, at, FOCUS_MODES));
  	const focusDistance = read("focusDistance", (raw, at) => requireBounded(raw, at, 0, MAXIMUM_FOCUS_DISTANCE));
  	return {
  		...frameRate === void 0 ? {} : { frameRate },
  		...facingMode === void 0 ? {} : { facingMode },
  		...resizeMode === void 0 ? {} : { resizeMode },
  		...zoom === void 0 ? {} : { zoom },
  		...focusMode === void 0 ? {} : { focusMode },
  		...focusDistance === void 0 ? {} : { focusDistance }
  	};
  }
  function readQuality(value, path) {
  	const record = requireRecord(value, path);
  	requireExactKeys(record, path, ["sampleCount", "reprojectionErrorPx"]);
  	return {
  		sampleCount: requireInteger(record["sampleCount"], member(path, "sampleCount"), 1, MAXIMUM_SAMPLE_COUNT),
  		reprojectionErrorPx: requireBounded(record["reprojectionErrorPx"], member(path, "reprojectionErrorPx"), 0, MAXIMUM_REPROJECTION_ERROR_PX)
  	};
  }
  function readDevice(value, path) {
  	const record = requireRecord(value, path);
  	requireExactKeys(record, path, [], ["label", "deviceId"]);
  	const label = "label" in record ? requireText(record["label"], member(path, "label")) : void 0;
  	const deviceId = "deviceId" in record ? requireText(record["deviceId"], member(path, "deviceId")) : void 0;
  	return {
  		...label === void 0 ? {} : { label },
  		...deviceId === void 0 ? {} : { deviceId }
  	};
  }
  function readProfile(input) {
  	assertNoForbiddenKeys(input, "", 0, /* @__PURE__ */ new WeakSet());
  	const record = requireRecord(input, "");
  	requireLiteral(record["schema"], "schema", CAMERA_INTRINSIC_PROFILE_SCHEMA, "unsupported-schema");
  	requireLiteral(record["version"], "version", 1, "unsupported-version");
  	requireExactKeys(record, "", [
  		"schema",
  		"version",
  		"profileId",
  		"cameraId",
  		"calibratedAt",
  		"producer",
  		"cameraModel",
  		"image",
  		"intrinsics",
  		"distortion"
  	], [
  		"capture",
  		"quality",
  		"device"
  	]);
  	const image = readImage(record["image"], "image");
  	const distortion = readDistortion(record["distortion"], "distortion");
  	if (image.undistorted && distortion.model !== "none") reject("inconsistent-profile", "distortion.model", "A profile for an already undistorted image cannot also carry distortion coefficients.");
  	const capture = "capture" in record ? readCapture(record["capture"], "capture") : void 0;
  	const quality = "quality" in record ? readQuality(record["quality"], "quality") : void 0;
  	const device = "device" in record ? readDevice(record["device"], "device") : void 0;
  	return {
  		schema: CAMERA_INTRINSIC_PROFILE_SCHEMA,
  		version: 1,
  		profileId: requireIdentifier(record["profileId"], "profileId"),
  		cameraId: requireIdentifier(record["cameraId"], "cameraId"),
  		calibratedAt: requireUtcTimestamp(record["calibratedAt"], "calibratedAt"),
  		producer: requireText(record["producer"], "producer"),
  		cameraModel: requireLiteral(record["cameraModel"], "cameraModel", "pinhole", "invalid-value"),
  		image,
  		intrinsics: readIntrinsics(record["intrinsics"], "intrinsics", image),
  		distortion,
  		...capture === void 0 ? {} : { capture },
  		...quality === void 0 ? {} : { quality },
  		...device === void 0 ? {} : { device }
  	};
  }
  function toResult(read) {
  	try {
  		return {
  			ok: true,
  			profile: read()
  		};
  	} catch (error) {
  		if (error instanceof ProfileRejection) return {
  			ok: false,
  			error: error.detail
  		};
  		throw error;
  	}
  }
  /** Validates a parsed document and returns a normalized profile, or the reason it was refused. */
  function parseCameraIntrinsicProfile(input) {
  	return toResult(() => readProfile(input));
  }
  /**
  * Renders a profile as JSON with a fixed member order.
  *
  * Stable output means the same profile always produces the same bytes, so a file can be compared or
  * hashed to tell whether two machines really hold the same calibration.
  */
  function orderedCapture(capture) {
  	const members = [
  		["frameRate", capture.frameRate],
  		["facingMode", capture.facingMode],
  		["resizeMode", capture.resizeMode],
  		["zoom", capture.zoom],
  		["focusMode", capture.focusMode],
  		["focusDistance", capture.focusDistance]
  	];
  	return Object.fromEntries(members.filter((entry) => entry[1] !== void 0));
  }
  function serializeCameraIntrinsicProfile(profile) {
  	const ordered = {
  		schema: profile.schema,
  		version: profile.version,
  		profileId: profile.profileId,
  		cameraId: profile.cameraId,
  		calibratedAt: profile.calibratedAt,
  		producer: profile.producer,
  		cameraModel: profile.cameraModel,
  		image: {
  			width: profile.image.width,
  			height: profile.image.height,
  			undistorted: profile.image.undistorted
  		},
  		intrinsics: {
  			fx: profile.intrinsics.fx,
  			fy: profile.intrinsics.fy,
  			cx: profile.intrinsics.cx,
  			cy: profile.intrinsics.cy,
  			skew: profile.intrinsics.skew
  		},
  		distortion: {
  			model: profile.distortion.model,
  			coefficients: [...profile.distortion.coefficients]
  		},
  		...profile.capture === void 0 ? {} : { capture: orderedCapture(profile.capture) },
  		...profile.quality === void 0 ? {} : { quality: {
  			sampleCount: profile.quality.sampleCount,
  			reprojectionErrorPx: profile.quality.reprojectionErrorPx
  		} },
  		...profile.device === void 0 ? {} : { device: {
  			...profile.device.label === void 0 ? {} : { label: profile.device.label },
  			...profile.device.deviceId === void 0 ? {} : { deviceId: profile.device.deviceId }
  		} }
  	};
  	return `${JSON.stringify(ordered, null, 2)}\n`;
  }
  //#endregion
  //#region src/calibration/registry.ts
  /**
  * The profiles this runtime knows about.
  *
  * Producer-agnostic by construction: a profile arrives as a document that
  * either passes validation or does not, and nothing here can tell chessboard
  * calibration from an operator pasting JSON. Naming a producing extension would
  * undo the split that keeps this package free of runtime dependencies.
  *
  * Registration is keyed by `cameraId`, not by `profileId`: a camera has one
  * calibration in force at a time, and a fresh solve replaces the previous one
  * rather than accumulating beside it.
  */
  var CameraProfileRegistry = class {
  	constructor() {
  		this.profiles = /* @__PURE__ */ new Map();
  	}
  	/**
  	* Validates a document and, only if it passes, stores it.
  	*
  	* Nothing is written before the document has been checked. A half-registered
  	* profile would be indistinguishable from a good one at the point of use.
  	*/
  	register(document) {
  		const result = parseCameraIntrinsicProfile(document);
  		if (!result.ok) return result;
  		this.profiles.set(result.profile.cameraId, result.profile);
  		return result;
  	}
  	forget(cameraId) {
  		return this.profiles.delete(cameraId.trim());
  	}
  	clear() {
  		this.profiles.clear();
  	}
  	get(cameraId) {
  		return this.profiles.get(cameraId.trim());
  	}
  	has(cameraId) {
  		return this.profiles.has(cameraId.trim());
  	}
  	cameraIds() {
  		return [...this.profiles.keys()].sort();
  	}
  	/**
  	* The profile for a camera, judged against how that camera is configured now.
  	*
  	* A missing profile is not an error: a camera that has never been calibrated
  	* is an ordinary state, and callers that need one say so themselves.
  	*/
  	assess(cameraId, conditions) {
  		const profile = this.get(cameraId);
  		if (!profile) return {
  			ok: false,
  			error: {
  				code: "missing-field",
  				path: "cameraId",
  				message: `No calibration profile is registered for camera ${cameraId}.`
  			}
  		};
  		const compatibility = evaluateProfileCompatibility(profile, conditions);
  		const adaptation = adaptProfileToConditions(profile, conditions);
  		const usable = usableIntrinsics(compatibility, adaptation);
  		return {
  			ok: true,
  			assessment: {
  				profile,
  				compatibility,
  				adaptation,
  				...usable === void 0 ? {} : { usable }
  			}
  		};
  	}
  };
  //#endregion
  //#region src/runtime-capability.ts
  var runtimeCapabilityKey = "kubohiroyaCameraSourceCapability";
  function createRuntimeCapability(host) {
  	const capability = {
  		version: 1,
  		requireVersion(version) {
  			if (version !== 1) throw new Error(`Unsupported Camera Source runtime capability version: ${version}; this build provides 1.`);
  			return capability;
  		},
  		registerProfile: (document) => host.registerProfile(document),
  		forgetProfile: (cameraId) => host.forgetProfile(cameraId),
  		profileFor: (cameraId) => host.profileFor(cameraId),
  		calibratedCameras: () => host.calibratedCameras(),
  		assessProfile: (cameraId) => host.assessProfile(cameraId),
  		intrinsicsFor: (cameraId) => host.intrinsicsFor(cameraId),
  		conditionsFor: (cameraId) => host.conditionsFor(cameraId),
  		conditionsGeneration: (cameraId) => host.conditionsGeneration(cameraId)
  	};
  	return Object.freeze(capability);
  }
  //#endregion
  //#region src/flip.ts
  var FLIPS = [
  	"none",
  	"horizontal",
  	"vertical",
  	"both"
  ];
  function isFlip(value) {
  	return typeof value === "string" && FLIPS.includes(value);
  }
  /** Reads a flip, accepting the boolean the older API used for left-right. */
  function toFlip(value, fallback = "none") {
  	if (isFlip(value)) return value;
  	if (value === true) return "horizontal";
  	if (value === false) return "none";
  	return fallback;
  }
  function flipsHorizontally(flip) {
  	return flip === "horizontal" || flip === "both";
  }
  function flipsVertically(flip) {
  	return flip === "vertical" || flip === "both";
  }
  //#endregion
  //#region src/video-preview.ts
  var videoLayer = "video";
  var haveCurrentData = 2;
  function videoSkinClass(renderer) {
  	const BaseSkin = renderer.exports?.Skin;
  	if (typeof BaseSkin !== "function") throw new Error("Camera preview requires renderer.exports.Skin.");
  	return class VideoSkin extends BaseSkin {
  		constructor(id, skinRenderer, video, onFrame) {
  			super(id, skinRenderer);
  			this.texture = null;
  			this.textureSize = [0, 0];
  			this.dirty = true;
  			this.disposed = false;
  			this.videoFrameCallbackId = null;
  			this.animationFrameId = null;
  			this.lastCurrentTime = NaN;
  			this.handleVideoFrame = () => {
  				if (this.disposed) return;
  				this.dirty = true;
  				this.onFrame(this.syncMetrics());
  				this.scheduleFrame();
  			};
  			this.handleAnimationFrame = () => {
  				if (this.disposed) return;
  				if (this.video.currentTime !== this.lastCurrentTime) {
  					this.dirty = true;
  					this.onFrame(this.syncMetrics());
  				}
  				this.scheduleFrame();
  			};
  			this.video = video;
  			this.onFrame = onFrame;
  			this.private = true;
  			this.syncMetrics();
  			this.scheduleFrame();
  		}
  		get size() {
  			return this.textureSize;
  		}
  		getTexture() {
  			if (this.disposed || this.video.readyState < haveCurrentData || this.video.videoWidth === 0 || this.video.videoHeight === 0) return null;
  			if (this.syncMetrics()) this.onFrame(true);
  			if (!this.dirty && this.video.currentTime === this.lastCurrentTime) return this.texture;
  			const gl = renderer.gl;
  			if (!this.texture) {
  				this.texture = gl.createTexture();
  				if (!this.texture) throw new Error("Camera preview could not create a WebGL texture.");
  				gl.bindTexture(gl.TEXTURE_2D, this.texture);
  				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  			} else gl.bindTexture(gl.TEXTURE_2D, this.texture);
  			gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  			try {
  				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);
  			} finally {
  				gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  			}
  			this.dirty = false;
  			this.lastCurrentTime = this.video.currentTime;
  			return this.texture;
  		}
  		dispose() {
  			this.disposed = true;
  			if (this.videoFrameCallbackId !== null && this.video.cancelVideoFrameCallback) this.video.cancelVideoFrameCallback(this.videoFrameCallbackId);
  			if (this.animationFrameId !== null && typeof globalThis.cancelAnimationFrame === "function") globalThis.cancelAnimationFrame(this.animationFrameId);
  			if (this.texture) renderer.gl.deleteTexture(this.texture);
  			this.texture = null;
  			super.dispose();
  		}
  		useNearest() {
  			return false;
  		}
  		updateSilhouette() {}
  		syncMetrics() {
  			const width = this.video.videoWidth;
  			const height = this.video.videoHeight;
  			if (width === this.textureSize[0] && height === this.textureSize[1]) return false;
  			this.textureSize = [width, height];
  			this.rotationCenter[0] = width / 2;
  			this.rotationCenter[1] = height / 2;
  			return true;
  		}
  		scheduleFrame() {
  			if (typeof this.video.requestVideoFrameCallback === "function") this.videoFrameCallbackId = this.video.requestVideoFrameCallback(this.handleVideoFrame);
  			else if (typeof globalThis.requestAnimationFrame === "function") this.animationFrameId = globalThis.requestAnimationFrame(this.handleAnimationFrame);
  		}
  	};
  }
  function assertRenderer(renderer) {
  	if (!renderer || !Array.isArray(renderer._allSkins) || !Number.isInteger(renderer._nextSkinId) || typeof renderer.createDrawable !== "function" || typeof renderer.destroyDrawable !== "function" || typeof renderer.destroySkin !== "function" || typeof renderer.getNativeSize !== "function") throw new Error("Camera preview requires a compatible TurboWarp renderer.");
  }
  function createVideoPreview(renderer, video, flip, requestRedraw) {
  	assertRenderer(renderer);
  	const VideoSkin = videoSkinClass(renderer);
  	const skinId = renderer._nextSkinId++;
  	let drawableId;
  	let disposed = false;
  	let previewFlip = flip;
  	let lastLayout = "";
  	const updateLayout = () => {
  		if (drawableId === void 0 || video.videoWidth === 0 || video.videoHeight === 0) return;
  		const [stageWidth, stageHeight] = renderer.getNativeSize();
  		const layout = [
  			video.videoWidth,
  			video.videoHeight,
  			stageWidth,
  			stageHeight,
  			previewFlip
  		].join(":");
  		if (layout === lastLayout) return;
  		const scale = Math.max(stageWidth / video.videoWidth, stageHeight / video.videoHeight) * 100;
  		renderer.updateDrawableScale(drawableId, [flipsHorizontally(previewFlip) ? -scale : scale, flipsVertically(previewFlip) ? -scale : scale]);
  		lastLayout = layout;
  	};
  	const skin = new VideoSkin(skinId, renderer, video, (metricsChanged) => {
  		if (metricsChanged) skin.emitWasAltered();
  		updateLayout();
  		requestRedraw();
  	});
  	renderer._allSkins[skinId] = skin;
  	try {
  		drawableId = renderer.createDrawable(videoLayer);
  		if (drawableId === void 0) throw new Error("Camera preview could not create a video drawable.");
  		renderer.updateDrawableSkinId(drawableId, skinId);
  		renderer.updateDrawablePosition(drawableId, [0, 0]);
  		updateLayout();
  		renderer.updateDrawableVisible(drawableId, true);
  		renderer.markSkinAsPrivate?.(skinId);
  		renderer.markDrawableAsNoninteractive?.(drawableId);
  		requestRedraw();
  	} catch (error) {
  		try {
  			if (drawableId !== void 0) renderer.destroyDrawable(drawableId, videoLayer);
  		} finally {
  			renderer.destroySkin(skinId);
  		}
  		throw error;
  	}
  	return Object.freeze({
  		setFlip: (nextFlip) => {
  			if (disposed || previewFlip === nextFlip) return;
  			previewFlip = nextFlip;
  			updateLayout();
  			requestRedraw();
  		},
  		dispose: () => {
  			if (disposed) return;
  			disposed = true;
  			try {
  				if (drawableId !== void 0) renderer.destroyDrawable(drawableId, videoLayer);
  			} finally {
  				try {
  					renderer.destroySkin(skinId);
  				} finally {
  					requestRedraw();
  				}
  			}
  		}
  	});
  }
  //#endregion
  //#region src/extension.ts
  var blockDefinitions = block_definitions_default.blocks;
  var defaultCameraId = "default";
  function mediaDevices() {
  	const devices = globalThis.navigator?.mediaDevices;
  	if (!devices || typeof devices.getUserMedia !== "function") throw new Error("Camera Source requires navigator.mediaDevices.getUserMedia.");
  	return devices;
  }
  function normalizeId(value, fallback = defaultCameraId) {
  	return String(value ?? "").trim() || fallback;
  }
  function optionalText(value) {
  	return String(value ?? "").trim();
  }
  function indexFrom(value) {
  	const parsed = Number.parseInt(String(value ?? ""), 10);
  	return Number.isFinite(parsed) ? parsed - 1 : -1;
  }
  function videoConstraints(options) {
  	if (typeof options.video === "object" && options.video !== null) return {
  		audio: false,
  		video: options.video
  	};
  	if (options.deviceId) return {
  		audio: false,
  		video: { deviceId: { exact: options.deviceId } }
  	};
  	return {
  		audio: false,
  		video: options.video ?? true
  	};
  }
  /** The preview flip a consumer asked for, accepting the older boolean. */
  function previewFlipOf(options) {
  	if (options.previewFlip !== void 0) return toFlip(options.previewFlip);
  	return options.mirrored === true ? "horizontal" : "none";
  }
  function cameraFailure(error) {
  	if (error instanceof Error) return {
  		code: error.name || "Error",
  		message: error.message
  	};
  	return {
  		code: "Error",
  		message: String(error)
  	};
  }
  var CameraSourceExtension = class {
  	constructor() {
  		this.sessions = /* @__PURE__ */ new Map();
  		this.blockLeases = /* @__PURE__ */ new Map();
  		this.blockPreviewLeases = /* @__PURE__ */ new Map();
  		this.blockPreviewRevisions = /* @__PURE__ */ new Map();
  		this.cameraFailures = /* @__PURE__ */ new Map();
  		this.profiles = new CameraProfileRegistry();
  		this.generations = /* @__PURE__ */ new Map();
  		this.lastConditions = /* @__PURE__ */ new Map();
  		this.calibrationEnabled = featureFlags.calibrationProfilesV1;
  		this.devices = [];
  		this.dispose = () => {
  			this.stopAllCameras();
  			const runtime = Scratch.vm.runtime;
  			if (runtime["kubohiroyaCameraSourceCapability"] === this.capability) delete runtime[runtimeCapabilityKey];
  			Scratch.vm.runtime.off?.("PROJECT_STOP_ALL", this.handleProjectBoundary);
  			Scratch.vm.runtime.off?.("PROJECT_LOADED", this.handleProjectBoundary);
  			Scratch.vm.runtime.off?.("RUNTIME_DISPOSED", this.dispose);
  		};
  		this.handleProjectBoundary = () => {
  			this.stopAllCameras();
  			this.profileError = void 0;
  		};
  		Scratch.vm.runtime.ext_kubohiroyacamerasource = this;
  		this.capability = this.calibrationEnabled ? createRuntimeCapability({
  			registerProfile: (document) => this.profiles.register(document),
  			forgetProfile: (cameraId) => this.profiles.forget(cameraId),
  			profileFor: (cameraId) => this.profiles.get(cameraId),
  			calibratedCameras: () => this.profiles.cameraIds(),
  			assessProfile: (cameraId) => {
  				const result = this.profiles.assess(cameraId, this.conditionsOf(cameraId));
  				return result.ok ? {
  					ok: true,
  					view: result.assessment
  				} : {
  					ok: false,
  					error: result.error
  				};
  			},
  			intrinsicsFor: (cameraId) => this.intrinsicsOf(cameraId),
  			conditionsFor: (cameraId) => this.conditionsOf(cameraId),
  			conditionsGeneration: (cameraId) => this.generationOf(cameraId)
  		}) : void 0;
  		if (this.capability) Scratch.vm.runtime[runtimeCapabilityKey] = this.capability;
  		Scratch.vm.runtime.on?.("PROJECT_STOP_ALL", this.handleProjectBoundary);
  		Scratch.vm.runtime.on?.("PROJECT_LOADED", this.handleProjectBoundary);
  		Scratch.vm.runtime.on?.("RUNTIME_DISPOSED", this.dispose);
  	}
  	getInfo() {
  		return {
  			id: extensionConfig.id,
  			name: Scratch.translate(block_definitions_default.extensionName),
  			blocks: blockDefinitions.filter((block) => block.feature === void 0 || this.calibrationEnabled).map((block) => this.toScratchBlock(block))
  		};
  	}
  	isCameraRunning(args = {}) {
  		const session = this.sessions.get(normalizeId(args.CAMERA_ID));
  		return session?.stream ? this.isStreamRunning(session.stream) : false;
  	}
  	cameraErrorCode(args = {}) {
  		return this.cameraFailures.get(normalizeId(args.CAMERA_ID))?.code ?? "";
  	}
  	cameraError(args = {}) {
  		return this.cameraFailures.get(normalizeId(args.CAMERA_ID))?.message ?? "";
  	}
  	cameraDeviceIdReporter(args = {}) {
  		return this.sessions.get(normalizeId(args.CAMERA_ID))?.activeDeviceId ?? "";
  	}
  	cameraFrameWidth(args = {}) {
  		const session = this.sessions.get(normalizeId(args.CAMERA_ID));
  		if (!session?.stream) return 0;
  		return session.video?.videoWidth || this.trackSetting(session, "width");
  	}
  	cameraFrameHeight(args = {}) {
  		const session = this.sessions.get(normalizeId(args.CAMERA_ID));
  		if (!session?.stream) return 0;
  		return session.video?.videoHeight || this.trackSetting(session, "height");
  	}
  	cameraFrameRate(args = {}) {
  		const session = this.sessions.get(normalizeId(args.CAMERA_ID));
  		return session?.stream ? this.trackSetting(session, "frameRate") : 0;
  	}
  	async startSharedCamera(args = {}) {
  		const cameraId = normalizeId(args.CAMERA_ID);
  		if (this.blockLeases.has(cameraId)) return;
  		const deviceId = optionalText(args.DEVICE_ID);
  		const options = {
  			owner: "camera-source-block",
  			cameraId
  		};
  		if (deviceId) options.deviceId = deviceId;
  		const lease = await this.acquireCamera(options);
  		this.blockLeases.set(cameraId, lease);
  	}
  	async acquireCamera(options = {}) {
  		const cameraId = normalizeId(options.cameraId);
  		const session = this.session(cameraId);
  		const token = Symbol(String(options.owner ?? "camera-lease"));
  		if (session.startPromise) await session.startPromise;
  		else if (!session.stream) await this.start(session, options);
  		session.leases.add(token);
  		try {
  			if (options.preview === true) {
  				session.previewLeases.set(token, previewFlipOf(options));
  				this.ensurePreview(session);
  				session.preview?.setFlip(this.previewFlip(session));
  			}
  		} catch (error) {
  			session.leases.delete(token);
  			session.previewLeases.delete(token);
  			this.stopWhenUnused(session);
  			this.cameraFailures.set(cameraId, cameraFailure(error));
  			throw error;
  		}
  		let released = false;
  		return Object.freeze({
  			getFrameSource: () => this.getFrameSource(session),
  			release: async () => {
  				if (released) return;
  				released = true;
  				session.leases.delete(token);
  				session.previewLeases.delete(token);
  				if (session.previewLeases.size === 0) {
  					session.preview?.dispose();
  					session.preview = null;
  				} else session.preview?.setFlip(this.previewFlip(session));
  				this.stopWhenUnused(session);
  			}
  		});
  	}
  	async showCameraPreview(args = {}) {
  		const cameraId = normalizeId(args.CAMERA_ID);
  		const flip = Scratch.Cast.toBoolean(args.MIRRORED ?? true) ? "horizontal" : "none";
  		if (this.blockPreviewLeases.get(cameraId)?.flip === flip) return;
  		const revision = this.nextPreviewBlockRevision(cameraId);
  		const lease = await this.acquireCamera({
  			owner: "camera-source-preview-block",
  			cameraId,
  			preview: true,
  			previewFlip: flip
  		});
  		if (this.blockPreviewRevisions.get(cameraId) !== revision) {
  			await lease.release();
  			return;
  		}
  		const current = this.blockPreviewLeases.get(cameraId);
  		this.blockPreviewLeases.set(cameraId, {
  			lease,
  			flip
  		});
  		await current?.lease.release();
  	}
  	async hideCameraPreview(args = {}) {
  		const cameraId = normalizeId(args.CAMERA_ID);
  		this.nextPreviewBlockRevision(cameraId);
  		const existing = this.blockPreviewLeases.get(cameraId);
  		if (!existing) return;
  		this.blockPreviewLeases.delete(cameraId);
  		await existing.lease.release();
  	}
  	stopSharedCamera(args = {}) {
  		this.stopCameraSession(normalizeId(args.CAMERA_ID));
  	}
  	async refreshCameraDevices() {
  		this.devices = (await mediaDevices().enumerateDevices()).filter((device) => device.kind === "videoinput");
  	}
  	cameraDeviceCount() {
  		return this.devices.length;
  	}
  	cameraDeviceIdAt(args) {
  		return this.devices[indexFrom(args.INDEX)]?.deviceId ?? "";
  	}
  	cameraDeviceLabelAt(args) {
  		return this.devices[indexFrom(args.INDEX)]?.label ?? "";
  	}
  	stopAllCameras() {
  		for (const cameraId of [...this.sessions.keys()]) this.stopCameraSession(cameraId);
  		this.blockLeases.clear();
  		this.blockPreviewLeases.clear();
  	}
  	registerCameraProfile(args = {}) {
  		const text = Scratch.Cast.toString(args.PROFILE_JSON ?? "");
  		let document;
  		try {
  			document = JSON.parse(text);
  		} catch {
  			this.profileError = {
  				code: "not-an-object",
  				path: "",
  				message: "The profile is not valid JSON."
  			};
  			return;
  		}
  		const result = this.profiles.register(document);
  		this.profileError = result.ok ? void 0 : result.error;
  	}
  	forgetCameraProfile(args = {}) {
  		this.profiles.forget(normalizeId(args.CAMERA_ID));
  	}
  	cameraProfileRegistered(args = {}) {
  		return this.profiles.has(normalizeId(args.CAMERA_ID));
  	}
  	cameraProfileJson(args = {}) {
  		const profile = this.profiles.get(normalizeId(args.CAMERA_ID));
  		return profile ? serializeCameraIntrinsicProfile(profile) : "";
  	}
  	cameraProfileError() {
  		return this.profileError?.code ?? "";
  	}
  	cameraProfileErrorDetail() {
  		if (!this.profileError) return "";
  		const { path, message } = this.profileError;
  		return path ? `${path}: ${message}` : message;
  	}
  	cameraProfileCompatibility(args = {}) {
  		const cameraId = normalizeId(args.CAMERA_ID);
  		const result = this.profiles.assess(cameraId, this.conditionsOf(cameraId));
  		return result.ok ? result.assessment.compatibility.state : "";
  	}
  	cameraProfileCompatibilityDetail(args = {}) {
  		const cameraId = normalizeId(args.CAMERA_ID);
  		const result = this.profiles.assess(cameraId, this.conditionsOf(cameraId));
  		if (!result.ok) return "";
  		const findings = decisiveFindings(result.assessment.compatibility);
  		if (findings.length === 0) return "The profile matches the camera as configured.";
  		return findings.map((entry) => entry.detail).join(" ");
  	}
  	cameraProfileAdaptation(args = {}) {
  		const cameraId = normalizeId(args.CAMERA_ID);
  		const result = this.profiles.assess(cameraId, this.conditionsOf(cameraId));
  		return result.ok ? result.assessment.adaptation.state : "";
  	}
  	cameraProfileIntrinsicsJson(args = {}) {
  		const cameraId = normalizeId(args.CAMERA_ID);
  		const usable = this.intrinsicsOf(cameraId);
  		return usable === void 0 ? "" : JSON.stringify(usable);
  	}
  	cameraConditionsJson(args = {}) {
  		return JSON.stringify(this.conditionsOf(normalizeId(args.CAMERA_ID)));
  	}
  	cameraConditionsGeneration(args = {}) {
  		return this.generationOf(normalizeId(args.CAMERA_ID));
  	}
  	/** What the track reports about itself right now. Read only. */
  	intrinsicsOf(cameraId) {
  		const id = normalizeId(cameraId);
  		const result = this.profiles.assess(id, this.conditionsOf(id));
  		return result.ok ? result.assessment.usable : void 0;
  	}
  	conditionsOf(cameraId) {
  		const id = normalizeId(cameraId);
  		const session = this.sessions.get(id);
  		if (!session?.stream) return {
  			width: 0,
  			height: 0,
  			deviceId: "",
  			previewFlip: "none"
  		};
  		const track = session.stream.getVideoTracks()[0];
  		let settings = {};
  		try {
  			settings = track?.getSettings() ?? {};
  		} catch {
  			settings = {};
  		}
  		const device = this.devices.find((entry) => entry.deviceId === session.activeDeviceId);
  		return readCameraConditions({
  			width: session.video?.videoWidth ?? 0,
  			height: session.video?.videoHeight ?? 0,
  			deviceId: session.activeDeviceId,
  			previewFlip: this.previewFlip(session),
  			...device?.label ? { label: device.label } : {}
  		}, settings);
  	}
  	/**
  	* A counter that moves when the geometry does.
  	*
  	* Derived by comparing the members that affect projection, so it advances on
  	* a resolution change or a zoom and stays put for a frame rate change. A
  	* consumer holding a placement solved from these conditions compares one
  	* number rather than re-checking each of them.
  	*/
  	generationOf(cameraId) {
  		const id = normalizeId(cameraId);
  		const conditions = this.conditionsOf(id);
  		const signature = JSON.stringify([
  			conditions.width,
  			conditions.height,
  			conditions.resizeMode ?? null,
  			conditions.zoom ?? null,
  			conditions.focusMode ?? null,
  			conditions.focusDistance ?? null,
  			conditions.deviceId
  		]);
  		const previous = this.lastConditions.get(id);
  		if (previous === void 0) {
  			this.lastConditions.set(id, signature);
  			this.generations.set(id, 0);
  			return 0;
  		}
  		if (previous === signature) return this.generations.get(id) ?? 0;
  		const next = (this.generations.get(id) ?? 0) + 1;
  		this.lastConditions.set(id, signature);
  		this.generations.set(id, next);
  		return next;
  	}
  	session(cameraId) {
  		const existing = this.sessions.get(cameraId);
  		if (existing) return existing;
  		const session = {
  			cameraId,
  			leases: /* @__PURE__ */ new Set(),
  			previewLeases: /* @__PURE__ */ new Map(),
  			active: true,
  			stream: null,
  			video: null,
  			preview: null,
  			startPromise: null,
  			activeDeviceId: ""
  		};
  		this.sessions.set(cameraId, session);
  		return session;
  	}
  	async start(session, options) {
  		session.startPromise = (async () => {
  			const stream = await mediaDevices().getUserMedia(videoConstraints(options));
  			let video = null;
  			try {
  				if (!session.active) throw new Error("Camera acquisition was cancelled.");
  				video = document.createElement("video");
  				video.muted = true;
  				video.playsInline = true;
  				video.srcObject = stream;
  				await video.play();
  				if (!session.active) throw new Error("Camera acquisition was cancelled.");
  				session.stream = stream;
  				session.video = video;
  				this.watchStreamEnd(session, stream);
  				this.updateActiveDevice(session);
  				this.cameraFailures.delete(session.cameraId);
  			} catch (error) {
  				stream.getTracks().forEach((track) => track.stop());
  				if (video) video.srcObject = null;
  				throw error;
  			}
  		})();
  		try {
  			await session.startPromise;
  		} catch (error) {
  			if (this.sessions.get(session.cameraId) === session) this.stopCameraSession(session.cameraId);
  			this.cameraFailures.set(session.cameraId, cameraFailure(error));
  			throw error;
  		}
  	}
  	nextPreviewBlockRevision(cameraId) {
  		const revision = (this.blockPreviewRevisions.get(cameraId) ?? 0) + 1;
  		this.blockPreviewRevisions.set(cameraId, revision);
  		return revision;
  	}
  	isStreamRunning(stream) {
  		return stream.active !== false && stream.getVideoTracks().some((track) => track.readyState !== "ended");
  	}
  	watchStreamEnd(session, stream) {
  		const handleEnded = () => {
  			if (this.sessions.get(session.cameraId) !== session || session.stream !== stream) return;
  			if (!this.isStreamRunning(stream)) this.stopCameraSession(session.cameraId);
  		};
  		for (const track of stream.getVideoTracks()) track.addEventListener("ended", handleEnded, { once: true });
  	}
  	updateActiveDevice(session) {
  		const settings = (session.stream?.getVideoTracks()[0] ?? null)?.getSettings();
  		session.activeDeviceId = typeof settings?.deviceId === "string" ? settings.deviceId : "";
  	}
  	trackSetting(session, name) {
  		const value = session.stream?.getVideoTracks()[0]?.getSettings()[name];
  		return typeof value === "number" && Number.isFinite(value) ? value : 0;
  	}
  	ensurePreview(session) {
  		if (session.preview || !session.video) return;
  		const runtime = Scratch.vm.runtime;
  		session.preview = createVideoPreview(runtime.renderer, session.video, this.previewFlip(session), () => runtime.requestRedraw?.());
  	}
  	/**
  	* How the preview is shown for a camera several consumers may be watching.
  	*
  	* Any consumer asking for a flipped preview flips it for everyone, which is
  	* the same rule the previous boolean followed.
  	*/
  	previewFlip(session) {
  		for (const flip of session.previewLeases.values()) if (flip !== "none") return flip;
  		return "none";
  	}
  	getFrameSource(session) {
  		if (!session.video || !session.stream) throw new Error("Shared camera is not running.");
  		return Object.freeze({
  			kind: "video",
  			element: session.video,
  			width: session.video.videoWidth,
  			height: session.video.videoHeight,
  			pixelFlip: "none",
  			previewFlip: this.previewFlip(session),
  			deviceId: session.activeDeviceId
  		});
  	}
  	stopWhenUnused(session) {
  		if (this.sessions.get(session.cameraId) !== session) return;
  		if (session.leases.size === 0) this.stopCameraSession(session.cameraId);
  	}
  	stopCameraSession(cameraId) {
  		const session = this.sessions.get(cameraId);
  		if (!session) return;
  		session.active = false;
  		this.nextPreviewBlockRevision(cameraId);
  		session.preview?.dispose();
  		session.stream?.getTracks().forEach((track) => track.stop());
  		if (session.video) session.video.srcObject = null;
  		session.stream = null;
  		session.video = null;
  		session.startPromise = null;
  		session.preview = null;
  		session.activeDeviceId = "";
  		session.leases.clear();
  		session.previewLeases.clear();
  		this.sessions.delete(cameraId);
  		this.blockLeases.delete(cameraId);
  		this.blockPreviewLeases.delete(cameraId);
  	}
  	toScratchBlock(block) {
  		return {
  			opcode: block.opcode,
  			blockType: Scratch.BlockType[block.blockType],
  			text: Scratch.translate(block.text),
  			arguments: Object.fromEntries(Object.entries(block.arguments).map(([name, argument]) => [name, {
  				type: Scratch.ArgumentType[argument.type],
  				defaultValue: argument.defaultValue
  			}]))
  		};
  	}
  };
  //#endregion
  //#region src/index.ts
  if (extensionConfig.unsandboxed && !Scratch.extensions.unsandboxed) throw new Error(`${extensionConfig.name} must run unsandboxed.`);
  Scratch.extensions.register(new CameraSourceExtension());
  //#endregion

})(Scratch);

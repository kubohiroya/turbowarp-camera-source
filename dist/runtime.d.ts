/**
 * The contract other extensions use to share a camera with this one.
 *
 * Published as its own entry point so a consumer states what it expects instead of re-declaring it.
 * A hand-written copy of an interface compiles perfectly against nothing: when the shape here
 * changes, the copy keeps type-checking in its own repository and fails at runtime in a browser,
 * which is the worst order to find out. Importing these declarations moves that failure to the
 * consumer's build.
 *
 * This module holds no logic and pulls in none of the extension, so importing it costs a consumer
 * nothing at runtime beyond the three constants below.
 */
/** The extension ID, as it appears in block opcodes and in a project's extension list. */
export declare const cameraSourceExtensionId = "kubohiroyacamerasource";
/**
 * Where the extension instance puts itself on the VM runtime.
 *
 * Present as soon as the extension is registered. Absent means Camera Source is not loaded, which a
 * consumer has to handle whatever else it does.
 */
export declare const cameraSourceRuntimeKey = "ext_kubohiroyacamerasource";
/**
 * Where the versioned capability sits, when the build publishing it has that path enabled.
 *
 * Separate from `cameraSourceRuntimeKey` on purpose. The extension key is present as soon as Camera
 * Source is registered; this one appears only when the calibration profile contract is switched on.
 * A consumer can therefore tell "not loaded" from "loaded, and not offering profiles", and neither
 * has to be reported as the other.
 */
export declare const cameraSourceCapabilityKey = "kubohiroyaCameraSourceCapability";
/** The capability version this build implements. `requireVersion` refuses any other. */
export declare const cameraSourceCapabilityVersion: 1;
/**
 * Which way an image has been turned over.
 *
 * `horizontal` is the left-right mirror, matching `cv::flip` with a flip code of 1, ffmpeg's
 * `hflip` and CSS `scaleX(-1)`. Rotation is deliberately not folded in: a portrait capture is a
 * rotation and not a flip, and once both exist their order matters.
 */
export type Flip = 'none' | 'horizontal' | 'vertical' | 'both';
export interface CameraAcquireOptions {
    /** Free text naming the caller. Appears in diagnostics; never used to decide anything. */
    owner?: string;
    /** The role name of the stream, such as `pose` or `qr`. Callers naming the same one share it. */
    cameraId?: string;
    deviceId?: string;
    video?: MediaTrackConstraints | boolean;
    /** How this consumer wants the stage preview drawn. Only meaningful together with `preview`. */
    previewFlip?: Flip;
    preview?: boolean;
}
export interface CameraFrameSource {
    readonly kind: 'video';
    readonly element: HTMLVideoElement;
    readonly width: number;
    readonly height: number;
    /**
     * How the stage preview is being drawn, which says nothing about the pixels.
     *
     * The frames behind it are always the ones the camera captured: drawing a preview turned over is
     * a rendering transform and never reaches them. A consumer that reads this as a statement about
     * the image and flips its coordinates to compensate feeds a solve reflected input, and the pose
     * that comes back is a left-right reflection whose reprojection error stays small.
     *
     * Read it when drawing something that sits next to the preview and should match it.
     */
    readonly previewFlip: Flip;
    readonly deviceId: string;
    /**
     * When the frame the element is showing was captured, as of the moment this source was taken.
     *
     * Absent until the camera has presented a frame, and where the browser has no
     * `requestVideoFrameCallback`; absent means unknown, never now. The element can present a newer
     * frame between taking the source and reading pixels from it, so the time belongs to the frame
     * presented when the source was taken — take the source immediately before reading pixels.
     */
    readonly frameTime?: CameraFrameTime;
}
/**
 * The capture time of a presented frame.
 *
 * `timestampUs` is microseconds since the Unix epoch on the page's monotonic clock
 * (`performance.timeOrigin + time`). Cameras on one page share that clock, so their frames can be
 * compared directly; it is not synchronized with any other computer.
 */
export interface CameraFrameTime {
    readonly timestampUs: number;
    /**
     * `capture` is when the frame left the device (`captureTime`). `presentation` is when the browser
     * presented it (`presentationTime`), later by the capture and decode pipeline, and used only where
     * the browser reports no capture time.
     */
    readonly source: 'capture' | 'presentation';
    /** Increases with every presented frame, so a frame already used can be recognized. */
    readonly presentedFrames: number;
}
export interface CameraLease {
    getFrameSource(): CameraFrameSource;
    release(): Promise<void>;
}
/**
 * What `Scratch.vm.runtime[cameraSourceRuntimeKey]` offers.
 *
 * Only the members a sharing consumer needs are named here. The extension instance carries its
 * block methods as well, but those are the block surface and not a contract between extensions.
 */
export interface CameraSourceRuntime {
    acquireCamera(options?: CameraAcquireOptions): Promise<CameraLease>;
}
/**
 * The profile contract, re-exported so a consumer states it rather than restating it.
 *
 * These are declarations only and cost a consumer nothing at run time. They are published because a
 * hand-written copy is checked against nothing: `turbowarp-camera-calibration` wrote its own copy of
 * the registry, named a method this extension does not have, and every attempt to publish a profile
 * failed for a reason unrelated to the message it produced. Its type-check passed throughout.
 */
export type { CameraProfileView, CameraSourceCapabilityV1 } from './runtime-capability.js';
export type { CalibrationCapture, CalibrationDeviceHint, CalibrationImage, CalibrationQuality, CameraDistortion, CameraIntrinsicProfileV1, CameraIntrinsics, CameraModel, DistortionModel, ProfileError, ProfileErrorCode, ProfileResult } from './calibration/types.js';
export type { AdaptationCode, AdaptationState, ProfileAdaptation, UsableIntrinsics } from './calibration/adaptation.js';
export type { CompatibilityCode, CompatibilityFinding, CompatibilityReport, CompatibilityState, FindingState } from './calibration/compatibility.js';
export type { CameraConditions } from './calibration/conditions.js';
import type { CameraSourceCapabilityV1 } from './runtime-capability.js';
/** Narrows a runtime value to the Camera Source surface, so a missing extension reads as absent. */
export declare function readCameraSourceRuntime(runtime: unknown): CameraSourceRuntime | undefined;
/**
 * Narrows a runtime value to the profile capability, or reports it as unavailable.
 *
 * Undefined means one of two things a consumer usually handles the same way: Camera Source is not
 * loaded, or it is loaded with the profile contract switched off. `readCameraSourceRuntime` is what
 * separates them when the difference matters -- a consumer that can still share a camera but cannot
 * ask about calibration should say that, rather than reporting the extension as missing.
 *
 * A version this build does not implement is a third thing again, and not an absence: the capability
 * is returned, and `requireVersion` refuses out loud when asked for a version it cannot honour.
 */
export declare function readCameraSourceCapability(runtime: unknown): CameraSourceCapabilityV1 | undefined;
//# sourceMappingURL=runtime.d.ts.map
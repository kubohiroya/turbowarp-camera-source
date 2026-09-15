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
/** Where the versioned capability sits, when the build publishing it has that path enabled. */
export declare const cameraSourceCapabilityKey = "kubohiroyaCameraSourceCapability";
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
/** Narrows a runtime value to the Camera Source surface, so a missing extension reads as absent. */
export declare function readCameraSourceRuntime(runtime: unknown): CameraSourceRuntime | undefined;
//# sourceMappingURL=runtime.d.ts.map
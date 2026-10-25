/**
 * Taking one still image out of a running camera.
 *
 * A consumer can already read `CameraFrameSource.element` and draw it itself, and the ones doing
 * computer vision should: they want the pixels, not a file. This is for the other kind of consumer,
 * which wants an encoded image to hand to something that speaks files -- an asset store, a download,
 * an HTTP server publishing the latest frame. Each of those would otherwise write the same canvas,
 * the same encode, the same resize, and get the mirroring and the upscaling wrong in its own way.
 *
 * Nothing here knows about HTTP, assets or storage. It returns bytes and the metadata needed to
 * describe them, and what happens to the bytes is the caller's business.
 */
import { type Flip } from './flip.js';
export type CameraSnapshotType = 'image/jpeg' | 'image/png' | 'image/webp';
export interface CameraCaptureOptions {
    /** Defaults to `image/jpeg`. */
    type?: CameraSnapshotType;
    /** 0 to 1, for `image/jpeg` and `image/webp`. Out-of-range values are clamped. */
    quality?: number;
    /** Upper bounds on the encoded image. Aspect ratio is kept, and the frame is never enlarged. */
    maxWidth?: number;
    maxHeight?: number;
    /**
     * How to turn the image over, defaulting to `none`: the camera's own capture.
     *
     * Not taken from the session's `previewFlip`, and this is the one decision here worth arguing
     * about. The preview's flip is a drawing choice, and the frames behind it are always the ones the
     * camera captured -- a profile's intrinsics describe that image, so a snapshot that silently
     * mirrored itself would disagree with every calibration solved against the same camera, and
     * disagree invisibly: a mirrored photograph of a room looks like a photograph of a room.
     *
     * A caller that wants what the operator was looking at -- a photo booth, a snapshot shown back to
     * the person in frame -- asks for it, and can read `previewFlip` off the frame source to find out
     * what that was.
     */
    flip?: Flip;
}
export interface CameraSnapshot {
    readonly type: CameraSnapshotType;
    readonly bytes: Uint8Array;
    readonly width: number;
    readonly height: number;
    /** `Date.now()` when the frame was drawn, not when the encode finished. */
    readonly capturedAt: number;
}
/** What this module needs of a video element, so a caller can pass anything that presents frames. */
export interface SnapshotSource {
    readonly videoWidth: number;
    readonly videoHeight: number;
    readonly readyState: number;
}
/**
 * Draws the frame the element is presenting and returns it encoded.
 *
 * No object URL is created and no canvas is attached to the document, so there is nothing to revoke
 * and nothing to leak: the canvas and the blob are unreachable once the bytes have been copied out.
 */
export declare function captureSnapshot(video: SnapshotSource, options?: CameraCaptureOptions): Promise<CameraSnapshot>;
//# sourceMappingURL=snapshot.d.ts.map
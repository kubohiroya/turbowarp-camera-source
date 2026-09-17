/**
 * When the frame a camera is showing was captured.
 *
 * `requestVideoFrameCallback` fires once for every frame the video element presents. For a local
 * camera Chrome reports `captureTime`, the moment the frame left the device, on the page's
 * `performance.now()` clock. Every camera on the page shares that clock, so frames from several
 * cameras can be lined up against each other.
 *
 * A browser that does not report `captureTime` still reports `presentationTime`, which is later by
 * the capture and decode pipeline. It is used then and named, because a consumer comparing
 * timestamps has to know which of the two it holds.
 */
import type {CameraFrameTime} from './runtime';

export interface VideoFrameMetadataLike {
  readonly captureTime?: number;
  readonly presentationTime?: number;
  readonly presentedFrames?: number;
}

type FrameCallbackElement = Pick<
  HTMLVideoElement,
  'requestVideoFrameCallback' | 'cancelVideoFrameCallback'
>;

function finite(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** The time of one presented frame, or the previous one when the metadata carries no time. */
export function frameTimeFrom(
  metadata: VideoFrameMetadataLike,
  timeOriginMs: number,
  previous: CameraFrameTime | undefined
): CameraFrameTime | undefined {
  const capture = finite(metadata.captureTime);
  const presentation = finite(metadata.presentationTime);
  const milliseconds = capture ?? presentation;
  if (milliseconds === undefined) return previous;
  return Object.freeze({
    timestampUs: Math.round((timeOriginMs + milliseconds) * 1000),
    source: capture === undefined ? 'presentation' : 'capture',
    presentedFrames: finite(metadata.presentedFrames) ?? (previous?.presentedFrames ?? 0) + 1
  });
}

/**
 * Follows one video element for as long as its camera runs.
 *
 * Nothing is recorded where the browser has no `requestVideoFrameCallback`; frame sources then carry
 * no time, which a consumer has to treat as unknown rather than as now.
 */
export class FrameTimeWatcher {
  private readonly element: FrameCallbackElement;
  private readonly timeOriginMs: number;
  private handle: number | undefined;
  private frame: CameraFrameTime | undefined;
  private disposed = false;

  public constructor(element: FrameCallbackElement, timeOriginMs: number) {
    this.element = element;
    this.timeOriginMs = timeOriginMs;
    this.schedule();
  }

  public latest(): CameraFrameTime | undefined {
    return this.frame;
  }

  public dispose(): void {
    this.disposed = true;
    if (this.handle !== undefined) {
      this.element.cancelVideoFrameCallback(this.handle);
      this.handle = undefined;
    }
  }

  private schedule(): void {
    if (this.disposed || typeof this.element.requestVideoFrameCallback !== 'function') return;
    this.handle = this.element.requestVideoFrameCallback((_now, metadata) => {
      this.handle = undefined;
      this.frame = frameTimeFrom(metadata as VideoFrameMetadataLike, this.timeOriginMs, this.frame);
      this.schedule();
    });
  }
}

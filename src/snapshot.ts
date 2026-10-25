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
import {flipsHorizontally, flipsVertically, type Flip} from './flip.js';

export type CameraSnapshotType = 'image/jpeg' | 'image/png' | 'image/webp';

const snapshotTypes: readonly CameraSnapshotType[] = ['image/jpeg', 'image/png', 'image/webp'];

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

interface CanvasLike {
  width: number;
  height: number;
  getContext(id: '2d'): SnapshotContext | null;
  convertToBlob?(options?: {type?: string; quality?: number}): Promise<Blob>;
  toBlob?(callback: (blob: Blob | null) => void, type?: string, quality?: number): void;
}

interface SnapshotContext {
  save(): void;
  restore(): void;
  scale(x: number, y: number): void;
  translate(x: number, y: number): void;
  drawImage(image: never, x: number, y: number, width: number, height: number): void;
}

const haveCurrentData = 2;

function requestedType(value: unknown): CameraSnapshotType {
  if (value === undefined) return 'image/jpeg';
  if (!snapshotTypes.includes(value as CameraSnapshotType)) {
    throw new TypeError(`Camera snapshot type must be one of ${snapshotTypes.join(', ')}.`);
  }
  return value as CameraSnapshotType;
}

/**
 * Clamps quality, but refuses a value that was never a quality.
 *
 * Out of range is a caller saying "as good as possible" in the wrong units, and clamping says the
 * same thing. `NaN` or a string is a bug, and silently encoding at the browser's default would hide
 * it behind an image that looks fine.
 */
function requestedQuality(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError('Camera snapshot quality must be a finite number between 0 and 1.');
  }
  return Math.min(1, Math.max(0, value));
}

function requestedBound(value: unknown, name: string): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new TypeError(`Camera snapshot ${name} must be a positive finite number.`);
  }
  return value;
}

/**
 * The encoded size: inside both bounds, same shape, never larger than the frame.
 *
 * Enlarging is left out rather than offered, because a caller asking for 4000 px of a 640 px frame
 * is asking for detail that does not exist, and a file that claims to have it is worse than one that
 * says 640. A future option can add it where somebody genuinely needs the pixels padded out.
 */
function encodedSize(
  width: number,
  height: number,
  maxWidth: number | undefined,
  maxHeight: number | undefined
): {width: number; height: number} {
  const scale = Math.min(
    1,
    maxWidth === undefined ? 1 : maxWidth / width,
    maxHeight === undefined ? 1 : maxHeight / height
  );
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

function createCanvas(width: number, height: number): CanvasLike {
  const offscreen = (globalThis as {OffscreenCanvas?: new (width: number, height: number) => CanvasLike})
    .OffscreenCanvas;
  if (typeof offscreen === 'function') return new offscreen(width, height);
  const createElement = (globalThis as {document?: {createElement?(tag: string): unknown}}).document
    ?.createElement;
  if (typeof createElement !== 'function') {
    throw new Error('Camera snapshots need either OffscreenCanvas or a document to make a canvas in.');
  }
  const canvas = createElement.call(globalThis.document, 'canvas') as CanvasLike;
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

async function encode(
  canvas: CanvasLike,
  type: CameraSnapshotType,
  quality: number | undefined
): Promise<Blob> {
  if (typeof canvas.convertToBlob === 'function') {
    return canvas.convertToBlob({type, ...(quality === undefined ? {} : {quality})});
  }
  if (typeof canvas.toBlob === 'function') {
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob!(
        (blob) => (blob ? resolve(blob) : reject(new Error('The camera frame could not be encoded.'))),
        type,
        quality
      );
    });
  }
  throw new Error('This canvas cannot encode an image.');
}

/**
 * Draws the frame the element is presenting and returns it encoded.
 *
 * No object URL is created and no canvas is attached to the document, so there is nothing to revoke
 * and nothing to leak: the canvas and the blob are unreachable once the bytes have been copied out.
 */
export async function captureSnapshot(
  video: SnapshotSource,
  options: CameraCaptureOptions = {}
): Promise<CameraSnapshot> {
  const type = requestedType(options.type);
  const quality = requestedQuality(options.quality);
  const maxWidth = requestedBound(options.maxWidth, 'maxWidth');
  const maxHeight = requestedBound(options.maxHeight, 'maxHeight');
  const flip: Flip = options.flip ?? 'none';

  if (video.readyState < haveCurrentData) {
    throw new Error('The shared camera has not presented a frame yet.');
  }
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  if (!(sourceWidth > 0) || !(sourceHeight > 0)) {
    throw new Error('The shared camera is presenting frames of no size.');
  }

  const size = encodedSize(sourceWidth, sourceHeight, maxWidth, maxHeight);
  const canvas = createCanvas(size.width, size.height);
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Camera snapshots need a 2d canvas context.');

  const horizontal = flipsHorizontally(flip);
  const vertical = flipsVertically(flip);
  context.save();
  try {
    if (horizontal || vertical) {
      context.translate(horizontal ? size.width : 0, vertical ? size.height : 0);
      context.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
    }
    context.drawImage(video as never, 0, 0, size.width, size.height);
  } finally {
    context.restore();
  }
  const capturedAt = Date.now();

  const blob = await encode(canvas, type, quality);
  // A browser that cannot encode the type asked for falls back to PNG rather than failing, and a
  // caller told `image/webp` while handed PNG bytes will write them under the wrong name.
  if (blob.type !== type) {
    throw new Error(`This browser encoded ${blob.type || 'an unknown type'} rather than ${type}.`);
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return Object.freeze({type, bytes, width: size.width, height: size.height, capturedAt});
}

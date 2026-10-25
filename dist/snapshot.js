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
import { flipsHorizontally, flipsVertically } from './flip.js';
const snapshotTypes = ['image/jpeg', 'image/png', 'image/webp'];
const haveCurrentData = 2;
function requestedType(value) {
    if (value === undefined)
        return 'image/jpeg';
    if (!snapshotTypes.includes(value)) {
        throw new TypeError(`Camera snapshot type must be one of ${snapshotTypes.join(', ')}.`);
    }
    return value;
}
/**
 * Clamps quality, but refuses a value that was never a quality.
 *
 * Out of range is a caller saying "as good as possible" in the wrong units, and clamping says the
 * same thing. `NaN` or a string is a bug, and silently encoding at the browser's default would hide
 * it behind an image that looks fine.
 */
function requestedQuality(value) {
    if (value === undefined)
        return undefined;
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new TypeError('Camera snapshot quality must be a finite number between 0 and 1.');
    }
    return Math.min(1, Math.max(0, value));
}
function requestedBound(value, name) {
    if (value === undefined)
        return undefined;
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
function encodedSize(width, height, maxWidth, maxHeight) {
    const scale = Math.min(1, maxWidth === undefined ? 1 : maxWidth / width, maxHeight === undefined ? 1 : maxHeight / height);
    return {
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale))
    };
}
function createCanvas(width, height) {
    const offscreen = globalThis
        .OffscreenCanvas;
    if (typeof offscreen === 'function')
        return new offscreen(width, height);
    const createElement = globalThis.document
        ?.createElement;
    if (typeof createElement !== 'function') {
        throw new Error('Camera snapshots need either OffscreenCanvas or a document to make a canvas in.');
    }
    const canvas = createElement.call(globalThis.document, 'canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}
async function encode(canvas, type, quality) {
    if (typeof canvas.convertToBlob === 'function') {
        return canvas.convertToBlob({ type, ...(quality === undefined ? {} : { quality }) });
    }
    if (typeof canvas.toBlob === 'function') {
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The camera frame could not be encoded.'))), type, quality);
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
export async function captureSnapshot(video, options = {}) {
    const type = requestedType(options.type);
    const quality = requestedQuality(options.quality);
    const maxWidth = requestedBound(options.maxWidth, 'maxWidth');
    const maxHeight = requestedBound(options.maxHeight, 'maxHeight');
    const flip = options.flip ?? 'none';
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
    if (!context)
        throw new Error('Camera snapshots need a 2d canvas context.');
    const horizontal = flipsHorizontally(flip);
    const vertical = flipsVertically(flip);
    context.save();
    try {
        if (horizontal || vertical) {
            context.translate(horizontal ? size.width : 0, vertical ? size.height : 0);
            context.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
        }
        context.drawImage(video, 0, 0, size.width, size.height);
    }
    finally {
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
    return Object.freeze({ type, bytes, width: size.width, height: size.height, capturedAt });
}
//# sourceMappingURL=snapshot.js.map
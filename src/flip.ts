/**
 * Which way an image has been turned over.
 *
 * `mirrored: boolean` could not say which axis, and a boolean on a frame source
 * could not say whether it described the pixels or the way they were being
 * shown. Those are different facts with different consequences: a consumer that
 * reads a display choice as a pixel state feeds flipped coordinates into a
 * solve, and the pose it gets back is a left-right reflection whose
 * reprojection error stays small.
 *
 * `horizontal` is the left-right mirror, matching `cv::flip` with a flip code of
 * 1, ffmpeg's `hflip` and CSS `scaleX(-1)`.
 *
 * Rotation is deliberately not folded in here. A portrait capture is a rotation
 * and not a flip, and once both exist their order matters; an enum that mixed
 * them could not express which was applied first.
 */
export type Flip = 'none' | 'horizontal' | 'vertical' | 'both';

export const FLIPS: readonly Flip[] = ['none', 'horizontal', 'vertical', 'both'];

export function isFlip(value: unknown): value is Flip {
  return typeof value === 'string' && (FLIPS as readonly string[]).includes(value);
}

/** Reads a flip, accepting the boolean the older API used for left-right. */
export function toFlip(value: unknown, fallback: Flip = 'none'): Flip {
  if (isFlip(value)) return value;
  if (value === true) return 'horizontal';
  if (value === false) return 'none';
  return fallback;
}

export function flipsHorizontally(flip: Flip): boolean {
  return flip === 'horizontal' || flip === 'both';
}

export function flipsVertically(flip: Flip): boolean {
  return flip === 'vertical' || flip === 'both';
}

/** Combines two flips; flipping the same axis twice returns it to none. */
export function combineFlips(left: Flip, right: Flip): Flip {
  const horizontal = flipsHorizontally(left) !== flipsHorizontally(right);
  const vertical = flipsVertically(left) !== flipsVertically(right);
  if (horizontal && vertical) return 'both';
  if (horizontal) return 'horizontal';
  if (vertical) return 'vertical';
  return 'none';
}

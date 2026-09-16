/**
 * Helpers over the published `Flip` vocabulary.
 *
 * The type itself lives in the runtime contract, because consumers read it off a frame source and
 * should not be re-declaring it. What stays here is the reasoning a caller needs and the small
 * operations the extension performs on it.
 *
 * The vocabulary replaced a `mirrored: boolean`, which could not say which axis, and on a frame
 * source could not say whether it described the pixels or the way they were being shown. Those are
 * different facts with different consequences: a consumer that reads a display choice as a pixel
 * state feeds flipped coordinates into a solve, and the pose it gets back is a left-right
 * reflection whose reprojection error stays small.
 */
import type { Flip } from './runtime.js';
export type { Flip };
export declare const FLIPS: readonly Flip[];
export declare function isFlip(value: unknown): value is Flip;
/** Reads a flip, accepting the boolean the older API used for left-right. */
export declare function toFlip(value: unknown, fallback?: Flip): Flip;
export declare function flipsHorizontally(flip: Flip): boolean;
export declare function flipsVertically(flip: Flip): boolean;
/** Combines two flips; flipping the same axis twice returns it to none. */
export declare function combineFlips(left: Flip, right: Flip): Flip;
//# sourceMappingURL=flip.d.ts.map
/**
 * Re-expresses a profile for a frame size it was not solved at.
 *
 * A consumer that finds a 1920x1080 profile against a 1280x720 frame has to do
 * something, and the arithmetic is not obvious: a pure downscale multiplies
 * `fx`, `fy`, `cx` and `cy` by the ratio, while a crop leaves the focal lengths
 * alone and shifts the principal point instead. The two produce different
 * geometry from the same pair of numbers.
 *
 * Only this extension can tell which happened, because only it sees the track's
 * `resizeMode` and the device's own reporting. Leaving the choice to consumers
 * means each of them guesses, and they guess differently: the same camera then
 * yields different placements depending on which extension asked. So the
 * decision, and the adapted numbers, are produced here.
 *
 * Distortion coefficients are left untouched. They are defined against
 * normalised image coordinates, so a uniform scale does not change them.
 */
import type { CompatibilityReport } from './compatibility.js';
import type { CameraConditions } from './conditions.js';
import type { CameraIntrinsicProfileV1, CameraIntrinsics } from './types.js';
export type AdaptationState = 'exact' | 'scaled' | 'unavailable';
export type AdaptationCode = 'exact' | 'uniform-scale' | 'no-frame' | 'aspect-changed' | 'cropped' | 'undistorted-frames';
export interface ProfileAdaptation {
    readonly state: AdaptationState;
    readonly code: AdaptationCode;
    /** The intrinsics to project the current frames with, when there are any. */
    readonly intrinsics?: CameraIntrinsics;
    readonly width: number;
    readonly height: number;
    /** The factor applied, 1 when the sizes already agreed. */
    readonly scale: number;
    readonly detail: string;
}
export declare function adaptProfileToConditions(profile: CameraIntrinsicProfileV1, conditions: CameraConditions): ProfileAdaptation;
export declare function scaleIntrinsics(intrinsics: CameraIntrinsics, scale: number): CameraIntrinsics;
/**
 * Numbers a consumer may actually project with.
 *
 * Separate from the stored profile and from the adaptation on purpose. Those two answer "what is
 * held" and "how would it be re-expressed", which are questions worth asking about a profile that
 * does not fit; this answers "what may be used", and it exists only when the answer is something.
 */
export interface UsableIntrinsics extends CameraIntrinsics {
    /** The frame size these numbers belong to. */
    readonly width: number;
    readonly height: number;
    readonly scale: number;
    readonly adaptation: AdaptationState;
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
export declare function usableIntrinsics(compatibility: CompatibilityReport, adaptation: ProfileAdaptation): UsableIntrinsics | undefined;
//# sourceMappingURL=adaptation.d.ts.map
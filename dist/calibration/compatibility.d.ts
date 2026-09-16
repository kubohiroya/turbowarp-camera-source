/**
 * Decides whether a stored profile still describes the camera in front of us.
 *
 * The verdict has three values, not two. "Cannot tell" is a distinct answer from "fits", and
 * collapsing the two is how a consumer ends up projecting with intrinsics that belong to a
 * different capture configuration — an error that produces plausible geometry rather than a
 * visible failure. A caller that only looks for `compatible` gets the safe behaviour by default.
 *
 * Every finding carries whether it decided the verdict, so an operator can be shown the one thing
 * that has to change without a frame rate difference looking like a reason to recalibrate.
 */
import type { CameraConditions } from './conditions.js';
import type { CameraIntrinsicProfileV1 } from './types.js';
export type CompatibilityState = 'compatible' | 'incompatible' | 'undetermined';
export type FindingState = 'matched' | 'mismatched' | 'unknown';
export type CompatibilityCode = 'image-size' | 'capture-conditions' | 'resize-mode' | 'zoom' | 'focus-mode' | 'focus-distance' | 'frame-rate' | 'facing-mode' | 'undistorted-frames' | 'device-label' | 'device-id';
export interface CompatibilityFinding {
    readonly code: CompatibilityCode;
    readonly state: FindingState;
    /**
     * Whether this finding took part in the verdict.
     *
     * A non-decisive finding is recorded for the operator and nothing else: frame rate and facing mode
     * do not change how a lens projects, and a browser-scoped device id changes without the camera
     * changing, so none of them may push a profile to `incompatible`.
     */
    readonly decisive: boolean;
    readonly detail: string;
}
export interface CompatibilityReport {
    readonly state: CompatibilityState;
    readonly findings: readonly CompatibilityFinding[];
}
/**
 * Judges a profile against the conditions a camera reports.
 *
 * The verdict is `incompatible` when any decisive finding mismatched, `undetermined` when any
 * decisive finding could not be settled, and `compatible` only when every decisive finding matched.
 * Unknown never resolves upward into `compatible`.
 */
export declare function evaluateProfileCompatibility(profile: CameraIntrinsicProfileV1, conditions: CameraConditions): CompatibilityReport;
/** The findings that decided the verdict, in the order they were made. */
export declare function decisiveFindings(report: CompatibilityReport): readonly CompatibilityFinding[];
//# sourceMappingURL=compatibility.d.ts.map
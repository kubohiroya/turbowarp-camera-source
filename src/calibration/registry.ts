/**
 * The profiles this runtime knows about.
 *
 * Producer-agnostic by construction: a profile arrives as a document that
 * either passes validation or does not, and nothing here can tell chessboard
 * calibration from an operator pasting JSON. Naming a producing extension would
 * undo the split that keeps this package free of runtime dependencies.
 *
 * Registration is keyed by `cameraId`, not by `profileId`: a camera has one
 * calibration in force at a time, and a fresh solve replaces the previous one
 * rather than accumulating beside it.
 */
import {
  adaptProfileToConditions,
  usableIntrinsics,
  type ProfileAdaptation,
  type UsableIntrinsics
} from './adaptation.js';
import {evaluateProfileCompatibility, type CompatibilityReport} from './compatibility.js';
import type {CameraConditions} from './conditions.js';
import {parseCameraIntrinsicProfile} from './profile.js';
import type {CameraIntrinsicProfileV1, ProfileError, ProfileResult} from './types.js';

export interface ProfileAssessment {
  /** The document as stored, for showing and re-exporting. Not a licence to project with it. */
  readonly profile: CameraIntrinsicProfileV1;
  readonly compatibility: CompatibilityReport;
  readonly adaptation: ProfileAdaptation;
  /**
   * The numbers that may be used, absent when none may be.
   *
   * Decided once, here, so that every surface — blocks, the runtime capability, anything added
   * later — inherits the rule instead of each one remembering to apply it.
   */
  readonly usable?: UsableIntrinsics;
}

export type AssessmentResult =
  | {readonly ok: true; readonly assessment: ProfileAssessment}
  | {readonly ok: false; readonly error: ProfileError};

export class CameraProfileRegistry {
  private readonly profiles = new Map<string, CameraIntrinsicProfileV1>();

  /**
   * Validates a document and, only if it passes, stores it.
   *
   * Nothing is written before the document has been checked. A half-registered
   * profile would be indistinguishable from a good one at the point of use.
   */
  public register(document: unknown): ProfileResult {
    const result = parseCameraIntrinsicProfile(document);
    if (!result.ok) return result;
    this.profiles.set(result.profile.cameraId, result.profile);
    return result;
  }

  public forget(cameraId: string): boolean {
    return this.profiles.delete(cameraId.trim());
  }

  public clear(): void {
    this.profiles.clear();
  }

  public get(cameraId: string): CameraIntrinsicProfileV1 | undefined {
    return this.profiles.get(cameraId.trim());
  }

  public has(cameraId: string): boolean {
    return this.profiles.has(cameraId.trim());
  }

  public cameraIds(): string[] {
    return [...this.profiles.keys()].sort();
  }

  /**
   * The profile for a camera, judged against how that camera is configured now.
   *
   * A missing profile is not an error: a camera that has never been calibrated
   * is an ordinary state, and callers that need one say so themselves.
   */
  public assess(cameraId: string, conditions: CameraConditions): AssessmentResult {
    const profile = this.get(cameraId);
    if (!profile) {
      return {
        ok: false,
        error: {
          code: 'missing-field',
          path: 'cameraId',
          message: `No calibration profile is registered for camera ${cameraId}.`
        }
      };
    }
    const compatibility = evaluateProfileCompatibility(profile, conditions);
    const adaptation = adaptProfileToConditions(profile, conditions);
    const usable = usableIntrinsics(compatibility, adaptation);
    return {
      ok: true,
      assessment: {
        profile,
        compatibility,
        adaptation,
        ...(usable === undefined ? {} : {usable})
      }
    };
  }
}

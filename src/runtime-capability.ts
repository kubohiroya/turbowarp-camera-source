/**
 * What other extensions may use without going through blocks.
 *
 * Published under a versioned key rather than as the extension object itself,
 * so a consumer states the contract it was written against and is refused
 * clearly instead of finding a method missing at the worst moment.
 */
import type {ProfileAdaptation, UsableIntrinsics} from './calibration/adaptation.js';
import type {CompatibilityReport} from './calibration/compatibility.js';
import type {CameraConditions} from './calibration/conditions.js';
import type {CameraIntrinsicProfileV1, ProfileResult} from './calibration/types.js';

export const runtimeCapabilityKey = 'kubohiroyaCameraSourceCapability';
export const runtimeCapabilityVersion = 1 as const;

export interface CameraProfileView {
  /** The document as stored. For showing an operator or writing back out, not for projecting with. */
  readonly profile: CameraIntrinsicProfileV1;
  readonly compatibility: CompatibilityReport;
  /** How the stored numbers would be re-expressed for this frame size, whether or not they may be used. */
  readonly adaptation: ProfileAdaptation;
  /**
   * The numbers that may be used, absent when none may be.
   *
   * A consumer that reaches for `profile.intrinsics` or `adaptation.intrinsics` instead is reading
   * past the question of whether this calibration belongs to this camera, and the wrong answer does
   * not look wrong: it projects, and returns geometry that reads as a slightly different pose.
   */
  readonly usable?: UsableIntrinsics;
}

export interface CameraSourceCapabilityV1 {
  readonly version: typeof runtimeCapabilityVersion;
  requireVersion(version: number): CameraSourceCapabilityV1;
  /** Stores a profile document, whatever produced it. */
  registerProfile(document: unknown): ProfileResult;
  forgetProfile(cameraId: string): boolean;
  profileFor(cameraId: string): CameraIntrinsicProfileV1 | undefined;
  calibratedCameras(): string[];
  /**
   * The profile judged against how the camera is configured right now.
   *
   * Absent when the camera has never been calibrated. That is an ordinary state and not a failure:
   * reporting it as one would leave every consumer deciding which failures are real, and the safe
   * reading of a failure is to stop, which is the wrong response to "nobody has calibrated this
   * camera yet".
   */
  assessProfile(cameraId: string): CameraProfileView | undefined;
  /**
   * The intrinsics to project the current frames with, or undefined when there are none to use.
   *
   * The short way to ask the only question a consumer usually has. `assessProfile` answers the same
   * thing in its `usable` member, alongside the reasons.
   */
  intrinsicsFor(cameraId: string): UsableIntrinsics | undefined;
  /**
   * What the track reports about itself, read only.
   *
   * Reading, never setting. Changing a shared camera's configuration from one
   * consumer would silently change what every other consumer is recording.
   */
  conditionsFor(cameraId: string): CameraConditions;
  /**
   * Increments whenever something that affects the geometry changes.
   *
   * A consumer holding a result derived from a profile can compare one integer
   * instead of re-checking every condition, and knows to discard what it cached
   * when the number moves.
   */
  conditionsGeneration(cameraId: string): number;
}

export function createRuntimeCapability(
  host: Omit<CameraSourceCapabilityV1, 'version' | 'requireVersion'>
): CameraSourceCapabilityV1 {
  const capability: CameraSourceCapabilityV1 = {
    version: runtimeCapabilityVersion,
    requireVersion(version) {
      if (version !== runtimeCapabilityVersion) {
        throw new Error(
          `Unsupported Camera Source runtime capability version: ${version}; this build provides ${runtimeCapabilityVersion}.`
        );
      }
      return capability;
    },
    registerProfile: (document) => host.registerProfile(document),
    forgetProfile: (cameraId) => host.forgetProfile(cameraId),
    profileFor: (cameraId) => host.profileFor(cameraId),
    calibratedCameras: () => host.calibratedCameras(),
    assessProfile: (cameraId) => host.assessProfile(cameraId),
    intrinsicsFor: (cameraId) => host.intrinsicsFor(cameraId),
    conditionsFor: (cameraId) => host.conditionsFor(cameraId),
    conditionsGeneration: (cameraId) => host.conditionsGeneration(cameraId)
  };
  return Object.freeze(capability);
}

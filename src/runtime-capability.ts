/**
 * What other extensions may use without going through blocks.
 *
 * Published under a versioned key rather than as the extension object itself,
 * so a consumer states the contract it was written against and is refused
 * clearly instead of finding a method missing at the worst moment.
 */
import type {ProfileAdaptation} from './calibration/adaptation.js';
import type {CompatibilityReport} from './calibration/compatibility.js';
import type {CameraConditions} from './calibration/conditions.js';
import type {
  CameraIntrinsicProfileV1,
  ProfileError,
  ProfileResult
} from './calibration/types.js';

export const runtimeCapabilityKey = 'kubohiroyaCameraSourceCapability';
export const runtimeCapabilityVersion = 1 as const;

export interface CameraProfileView {
  readonly profile: CameraIntrinsicProfileV1;
  readonly compatibility: CompatibilityReport;
  readonly adaptation: ProfileAdaptation;
}

export interface CameraSourceCapabilityV1 {
  readonly version: typeof runtimeCapabilityVersion;
  requireVersion(version: number): CameraSourceCapabilityV1;
  /** Stores a profile document, whatever produced it. */
  registerProfile(document: unknown): ProfileResult;
  forgetProfile(cameraId: string): boolean;
  profileFor(cameraId: string): CameraIntrinsicProfileV1 | undefined;
  calibratedCameras(): string[];
  /** The profile judged against how the camera is configured right now. */
  assessProfile(
    cameraId: string
  ): {ok: true; view: CameraProfileView} | {ok: false; error: ProfileError};
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
    conditionsFor: (cameraId) => host.conditionsFor(cameraId),
    conditionsGeneration: (cameraId) => host.conditionsGeneration(cameraId)
  };
  return Object.freeze(capability);
}

/**
 * Startup-fixed feature flags.
 *
 * Read once at module load, so a flag cannot change while a session is running
 * and leave half the work done under one setting and half under another.
 *
 * The calibration profile contract is off by default. Camera acquisition and
 * preview are untouched by it and keep working either way; what the flag gates
 * is the new surface, until it has been exercised against a real calibrator.
 */
export interface CameraSourceFeatureFlags {
  readonly calibrationProfilesV1: boolean;
}

interface FeatureFlagGlobal {
  readonly __TWCS_FEATURE_FLAGS__?: Partial<CameraSourceFeatureFlags>;
}

const overrides = (globalThis as FeatureFlagGlobal).__TWCS_FEATURE_FLAGS__;

export const featureFlags: CameraSourceFeatureFlags = Object.freeze({
  calibrationProfilesV1: overrides?.calibrationProfilesV1 === true
});

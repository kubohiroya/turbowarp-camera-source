// Defined in the published entry rather than here, so the name a consumer imports and the name this
// extension publishes under cannot drift apart into two string literals that agree by inspection.
export { cameraSourceCapabilityKey as runtimeCapabilityKey, cameraSourceCapabilityVersion as runtimeCapabilityVersion } from './runtime.js';
import { cameraSourceCapabilityVersion } from './runtime.js';
const runtimeCapabilityVersion = cameraSourceCapabilityVersion;
export function createRuntimeCapability(host) {
    const capability = {
        version: runtimeCapabilityVersion,
        requireVersion(version) {
            if (version !== runtimeCapabilityVersion) {
                throw new Error(`Unsupported Camera Source runtime capability version: ${version}; this build provides ${runtimeCapabilityVersion}.`);
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
//# sourceMappingURL=runtime-capability.js.map
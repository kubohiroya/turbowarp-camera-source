/**
 * The contract other extensions use to share a camera with this one.
 *
 * Published as its own entry point so a consumer states what it expects instead of re-declaring it.
 * A hand-written copy of an interface compiles perfectly against nothing: when the shape here
 * changes, the copy keeps type-checking in its own repository and fails at runtime in a browser,
 * which is the worst order to find out. Importing these declarations moves that failure to the
 * consumer's build.
 *
 * This module holds no logic and pulls in none of the extension, so importing it costs a consumer
 * nothing at runtime beyond the three constants below.
 */
/** The extension ID, as it appears in block opcodes and in a project's extension list. */
export const cameraSourceExtensionId = 'kubohiroyacamerasource';
/**
 * Where the extension instance puts itself on the VM runtime.
 *
 * Present as soon as the extension is registered. Absent means Camera Source is not loaded, which a
 * consumer has to handle whatever else it does.
 */
export const cameraSourceRuntimeKey = 'ext_kubohiroyacamerasource';
/**
 * Where the versioned capability sits, when the build publishing it has that path enabled.
 *
 * Separate from `cameraSourceRuntimeKey` on purpose. The extension key is present as soon as Camera
 * Source is registered; this one appears only when the calibration profile contract is switched on.
 * A consumer can therefore tell "not loaded" from "loaded, and not offering profiles", and neither
 * has to be reported as the other.
 */
export const cameraSourceCapabilityKey = 'kubohiroyaCameraSourceCapability';
/** The capability version this build implements. `requireVersion` refuses any other. */
export const cameraSourceCapabilityVersion = 1;
/** Narrows a runtime value to the Camera Source surface, so a missing extension reads as absent. */
export function readCameraSourceRuntime(runtime) {
    if (typeof runtime !== 'object' || runtime === null)
        return undefined;
    const candidate = runtime[cameraSourceRuntimeKey];
    if (typeof candidate !== 'object' || candidate === null)
        return undefined;
    const { acquireCamera } = candidate;
    return typeof acquireCamera === 'function' ? candidate : undefined;
}
/**
 * Narrows a runtime value to the profile capability, or reports it as unavailable.
 *
 * Undefined means one of two things a consumer usually handles the same way: Camera Source is not
 * loaded, or it is loaded with the profile contract switched off. `readCameraSourceRuntime` is what
 * separates them when the difference matters -- a consumer that can still share a camera but cannot
 * ask about calibration should say that, rather than reporting the extension as missing.
 *
 * A version this build does not implement is a third thing again, and not an absence: the capability
 * is returned, and `requireVersion` refuses out loud when asked for a version it cannot honour.
 */
export function readCameraSourceCapability(runtime) {
    if (typeof runtime !== 'object' || runtime === null)
        return undefined;
    const candidate = runtime[cameraSourceCapabilityKey];
    if (typeof candidate !== 'object' || candidate === null)
        return undefined;
    const { requireVersion } = candidate;
    return typeof requireVersion === 'function' ? candidate : undefined;
}
//# sourceMappingURL=runtime.js.map
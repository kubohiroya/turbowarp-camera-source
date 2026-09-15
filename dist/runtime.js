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
/** Where the versioned capability sits, when the build publishing it has that path enabled. */
export const cameraSourceCapabilityKey = 'kubohiroyaCameraSourceCapability';
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
//# sourceMappingURL=runtime.js.map
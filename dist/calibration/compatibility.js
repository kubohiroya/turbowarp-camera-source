/** Zoom readings are device-reported floats; compare them with a tolerance rather than exactly. */
const ZOOM_TOLERANCE = 1e-6;
const FOCUS_DISTANCE_TOLERANCE = 1e-6;
function finding(code, state, decisive, detail) {
    return { code, state, decisive, detail };
}
function describe(value) {
    return value === undefined ? 'not reported' : String(value);
}
/**
 * Compares one optical member.
 *
 * Absent on both sides is agreement, not ignorance: the device reported no such control when the
 * calibration was solved and reports none now. Present on one side only is a change nobody can
 * quantify, so it is left unknown rather than guessed in either direction.
 */
function compareMember(code, name, recorded, observed, equal) {
    if (recorded === undefined && observed === undefined) {
        return finding(code, 'matched', true, `Neither the profile nor the camera reports ${name}.`);
    }
    if (recorded === undefined || observed === undefined) {
        return finding(code, 'unknown', true, `${name} is ${describe(recorded)} in the profile and ${describe(observed)} now, so the two cannot be compared.`);
    }
    const same = equal(recorded, observed);
    return finding(code, same ? 'matched' : 'mismatched', true, same
        ? `${name} is ${describe(observed)} in both.`
        : `${name} was ${describe(recorded)} at calibration and is ${describe(observed)} now.`);
}
const sameText = (left, right) => left === right;
const nearlyEqual = (tolerance) => (left, right) => Math.abs(left - right) <= tolerance;
function captureFindings(capture, conditions) {
    return [
        compareMember('resize-mode', 'Resize mode', capture.resizeMode, conditions.resizeMode, sameText),
        compareMember('zoom', 'Zoom', capture.zoom, conditions.zoom, nearlyEqual(ZOOM_TOLERANCE)),
        compareMember('focus-mode', 'Focus mode', capture.focusMode, conditions.focusMode, sameText),
        compareMember('focus-distance', 'Focus distance', capture.focusDistance, conditions.focusDistance, nearlyEqual(FOCUS_DISTANCE_TOLERANCE))
    ];
}
function imageSizeFinding(profile, conditions) {
    const expected = `${profile.image.width}x${profile.image.height}`;
    if (conditions.width === 0 || conditions.height === 0) {
        return finding('image-size', 'unknown', true, `The camera has delivered no frame yet, so its size cannot be compared with the calibrated ${expected}.`);
    }
    const actual = `${conditions.width}x${conditions.height}`;
    return actual === expected
        ? finding('image-size', 'matched', true, `The frame is ${actual}, as calibrated.`)
        : finding('image-size', 'mismatched', true, `The calibration was solved at ${expected} and the camera now delivers ${actual}.`);
}
function deviceFindings(profile, conditions) {
    const recordedLabel = profile.device?.label;
    const observedLabel = conditions.label;
    const label = recordedLabel !== undefined && observedLabel !== undefined
        ? finding('device-label', recordedLabel === observedLabel ? 'matched' : 'mismatched', true, recordedLabel === observedLabel
            ? `The camera still reports itself as ${observedLabel}.`
            : `The profile was solved on ${recordedLabel} and the camera now reports ${observedLabel}.`)
        : finding('device-label', 'unknown', false, 'A device label is missing on one side, which is normal before the browser grants camera permission.');
    const recordedId = profile.device?.deviceId;
    const observedId = conditions.deviceId.length === 0 ? undefined : conditions.deviceId;
    const identity = finding('device-id', recordedId !== undefined && observedId !== undefined && recordedId === observedId
        ? 'matched'
        : 'unknown', false, 'A device id is scoped to one browser and profile, so it changes without the camera changing. It is a hint for ordering candidates, never proof of identity.');
    return [label, identity];
}
/**
 * Judges a profile against the conditions a camera reports.
 *
 * The verdict is `incompatible` when any decisive finding mismatched, `undetermined` when any
 * decisive finding could not be settled, and `compatible` only when every decisive finding matched.
 * Unknown never resolves upward into `compatible`.
 */
export function evaluateProfileCompatibility(profile, conditions) {
    const findings = [imageSizeFinding(profile, conditions)];
    if (profile.image.undistorted) {
        findings.push(finding('undistorted-frames', 'unknown', true, 'The profile describes already undistorted images. This extension hands over the camera frames as captured and cannot confirm that something upstream corrects them.'));
    }
    if (profile.capture === undefined) {
        findings.push(finding('capture-conditions', 'unknown', true, 'The profile records no capture conditions, so whether the optics are configured as they were at calibration cannot be decided.'));
    }
    else {
        findings.push(...captureFindings(profile.capture, conditions));
    }
    findings.push(finding('frame-rate', 'matched', false, `Frame rate was ${describe(profile.capture?.frameRate)} at calibration and is ${describe(conditions.frameRate)} now. It does not change how the lens projects.`), finding('facing-mode', 'matched', false, `Facing mode was ${describe(profile.capture?.facingMode)} at calibration and is ${describe(conditions.facingMode)} now.`), ...deviceFindings(profile, conditions));
    const decisive = findings.filter((entry) => entry.decisive);
    const state = decisive.some((entry) => entry.state === 'mismatched')
        ? 'incompatible'
        : decisive.some((entry) => entry.state === 'unknown')
            ? 'undetermined'
            : 'compatible';
    return { state, findings };
}
/** The findings that decided the verdict, in the order they were made. */
export function decisiveFindings(report) {
    return report.findings.filter((entry) => entry.decisive && entry.state !== 'matched');
}
//# sourceMappingURL=compatibility.js.map
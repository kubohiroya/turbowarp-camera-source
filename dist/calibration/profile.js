export const CAMERA_INTRINSIC_PROFILE_SCHEMA = 'twcs/camera-intrinsics';
export const CAMERA_INTRINSIC_PROFILE_VERSION = 1;
/** The application-specific format this contract replaces. Read for migration, never written. */
export const LEGACY_CALIBRATION_SCHEMA = 'twrmc/camera-calibration';
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;
const UTC_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/;
const MAXIMUM_IMAGE_EDGE = 16384;
const MAXIMUM_PIXEL_MAGNITUDE = 1e7;
const MAXIMUM_DISTORTION_MAGNITUDE = 1e4;
const MAXIMUM_SAMPLE_COUNT = 10000;
const MAXIMUM_REPROJECTION_ERROR_PX = 1e4;
const MAXIMUM_TEXT_LENGTH = 256;
const MAXIMUM_FRAME_RATE = 1000;
const MAXIMUM_ZOOM = 1000;
const MAXIMUM_FOCUS_DISTANCE = 1e4;
const MAXIMUM_SCAN_DEPTH = 16;
const AFFINE_ROW_TOLERANCE = 1e-6;
const DISTORTION_MODELS = ['none', 'brown-conrady', 'kannala-brandt'];
const RESIZE_MODES = ['none', 'crop-and-scale'];
const FOCUS_MODES = ['none', 'manual', 'single-shot', 'continuous'];
/**
 * Coefficient counts each model accepts.
 *
 * The Brown-Conrady lengths are the OpenCV sets that consumers already handle: four, the usual five
 * with k3, and eight for the rational model. Longer OpenCV vectors (thin prism, tilted sensor) are
 * rejected rather than carried, because no consumer in this family implements them and a profile
 * that is accepted but only partly applied is worse than one that is refused.
 */
const DISTORTION_COEFFICIENT_LENGTHS = {
    none: [0],
    'brown-conrady': [4, 5, 8],
    'kannala-brandt': [4]
};
/**
 * Key names that carry pairing or authentication material.
 *
 * Signaling data is short-lived session state and a calibration profile is a document operators keep
 * and copy between venues. Rejecting the whole document is deliberate: a profile that reached here
 * carrying an SDP is evidence that something upstream is mixing the two, and quietly stripping the
 * key would hide that.
 */
const FORBIDDEN_KEYS = new Set([
    'accesstoken',
    'answer',
    'apikey',
    'authorization',
    'candidate',
    'credential',
    'credentials',
    'ice',
    'icecandidate',
    'offer',
    'passphrase',
    'password',
    'secret',
    'sdp',
    'token'
]);
class ProfileRejection extends Error {
    constructor(detail) {
        super(detail.message);
        this.name = 'ProfileRejection';
        this.detail = detail;
    }
}
function reject(code, path, message) {
    throw new ProfileRejection({ code, path, message });
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function member(path, name) {
    return path.length === 0 ? name : `${path}.${name}`;
}
/** Normalizes a key so `ICE-Candidate`, `iceCandidate` and `ice_candidate` all match one entry. */
function comparableKey(key) {
    return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}
function assertNoForbiddenKeys(value, path, depth, seen) {
    if (depth > MAXIMUM_SCAN_DEPTH) {
        reject('invalid-value', path, 'The document is nested more deeply than a profile ever is.');
    }
    if (typeof value !== 'object' || value === null)
        return;
    if (seen.has(value))
        reject('invalid-value', path, 'The document contains a cycle.');
    seen.add(value);
    if (Array.isArray(value)) {
        value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`, depth + 1, seen));
        return;
    }
    for (const [key, child] of Object.entries(value)) {
        if (FORBIDDEN_KEYS.has(comparableKey(key))) {
            reject('forbidden-field', member(path, key), 'Pairing and authentication material must not travel inside a calibration profile.');
        }
        assertNoForbiddenKeys(child, member(path, key), depth + 1, seen);
    }
}
function requireRecord(value, path) {
    if (!isRecord(value)) {
        reject(path.length === 0 ? 'not-an-object' : 'invalid-type', path, 'Expected an object.');
    }
    return value;
}
/** Rejects unknown members as well as missing ones, so an unrecognized field is never ignored. */
function requireExactKeys(record, path, required, optional = []) {
    const known = new Set([...required, ...optional]);
    for (const key of Object.keys(record)) {
        if (!known.has(key))
            reject('unexpected-field', member(path, key), 'Unknown member.');
    }
    for (const key of required) {
        if (!(key in record))
            reject('missing-field', member(path, key), 'Required member is missing.');
    }
}
function requireText(value, path) {
    if (typeof value !== 'string')
        reject('invalid-type', path, 'Expected a string.');
    if (value.length === 0 || value.length > MAXIMUM_TEXT_LENGTH) {
        reject('out-of-range', path, `Expected between 1 and ${MAXIMUM_TEXT_LENGTH} characters.`);
    }
    return value;
}
function requireIdentifier(value, path) {
    const text = requireText(value, path);
    if (!IDENTIFIER_PATTERN.test(text)) {
        reject('invalid-value', path, 'Expected letters, digits, dot, underscore, colon or hyphen.');
    }
    return text;
}
function requireUtcTimestamp(value, path) {
    const text = requireText(value, path);
    if (!UTC_TIMESTAMP_PATTERN.test(text) || !Number.isFinite(Date.parse(text))) {
        reject('invalid-value', path, 'Expected an RFC 3339 timestamp in UTC, such as 2026-09-15T04:05:06Z.');
    }
    return text;
}
function requireBoolean(value, path) {
    if (typeof value !== 'boolean')
        reject('invalid-type', path, 'Expected a boolean.');
    return value;
}
function requireFinite(value, path) {
    if (typeof value !== 'number')
        reject('invalid-type', path, 'Expected a number.');
    if (!Number.isFinite(value))
        reject('invalid-value', path, 'Expected a finite number.');
    return value;
}
function requireInteger(value, path, minimum, maximum) {
    const numeric = requireFinite(value, path);
    if (!Number.isInteger(numeric))
        reject('invalid-value', path, 'Expected an integer.');
    if (numeric < minimum || numeric > maximum) {
        reject('out-of-range', path, `Expected between ${minimum} and ${maximum}.`);
    }
    return numeric;
}
function requireBounded(value, path, minimum, maximum) {
    const numeric = requireFinite(value, path);
    if (numeric < minimum || numeric > maximum) {
        reject('out-of-range', path, `Expected between ${minimum} and ${maximum}.`);
    }
    return numeric;
}
function requireLiteral(value, path, expected, code) {
    if (value !== expected)
        reject(code, path, `Expected ${JSON.stringify(expected)}.`);
    return expected;
}
function readImage(value, path) {
    const record = requireRecord(value, path);
    requireExactKeys(record, path, ['width', 'height', 'undistorted']);
    return {
        width: requireInteger(record['width'], member(path, 'width'), 1, MAXIMUM_IMAGE_EDGE),
        height: requireInteger(record['height'], member(path, 'height'), 1, MAXIMUM_IMAGE_EDGE),
        undistorted: requireBoolean(record['undistorted'], member(path, 'undistorted'))
    };
}
/**
 * Reads the pinhole parameters.
 *
 * The principal point is allowed to sit outside the frame — a cropped or shifted sensor puts it
 * there legitimately — but not arbitrarily far, because a principal point far outside the image is
 * the signature of values given in the wrong unit rather than of an unusual lens.
 */
function readIntrinsics(value, path, image) {
    const record = requireRecord(value, path);
    requireExactKeys(record, path, ['fx', 'fy', 'cx', 'cy', 'skew']);
    return {
        fx: requireBounded(record['fx'], member(path, 'fx'), Number.MIN_VALUE, MAXIMUM_PIXEL_MAGNITUDE),
        fy: requireBounded(record['fy'], member(path, 'fy'), Number.MIN_VALUE, MAXIMUM_PIXEL_MAGNITUDE),
        cx: requireBounded(record['cx'], member(path, 'cx'), -image.width, image.width * 2),
        cy: requireBounded(record['cy'], member(path, 'cy'), -image.height, image.height * 2),
        skew: requireBounded(record['skew'], member(path, 'skew'), -MAXIMUM_PIXEL_MAGNITUDE, MAXIMUM_PIXEL_MAGNITUDE)
    };
}
function readDistortion(value, path) {
    const record = requireRecord(value, path);
    requireExactKeys(record, path, ['model', 'coefficients']);
    const modelPath = member(path, 'model');
    const rawModel = record['model'];
    if (typeof rawModel !== 'string' || !DISTORTION_MODELS.includes(rawModel)) {
        reject('invalid-distortion', modelPath, `Expected one of ${DISTORTION_MODELS.join(', ')}.`);
    }
    const model = rawModel;
    const coefficientsPath = member(path, 'coefficients');
    const rawCoefficients = record['coefficients'];
    if (!Array.isArray(rawCoefficients)) {
        reject('invalid-type', coefficientsPath, 'Expected an array.');
    }
    const allowed = DISTORTION_COEFFICIENT_LENGTHS[model];
    if (!allowed.includes(rawCoefficients.length)) {
        reject('invalid-distortion', coefficientsPath, `The ${model} model takes ${allowed.join(' or ')} coefficients, not ${rawCoefficients.length}.`);
    }
    const coefficients = rawCoefficients.map((coefficient, index) => requireBounded(coefficient, `${coefficientsPath}[${index}]`, -MAXIMUM_DISTORTION_MAGNITUDE, MAXIMUM_DISTORTION_MAGNITUDE));
    return { model, coefficients };
}
function requireEnum(value, path, allowed) {
    const text = requireText(value, path);
    if (!allowed.includes(text))
        reject('invalid-value', path, `Expected one of ${allowed.join(', ')}.`);
    return text;
}
function readCapture(value, path) {
    const record = requireRecord(value, path);
    requireExactKeys(record, path, [], ['frameRate', 'facingMode', 'resizeMode', 'zoom', 'focusMode', 'focusDistance']);
    const read = (name, reader) => name in record ? reader(record[name], member(path, name)) : undefined;
    const frameRate = read('frameRate', (raw, at) => requireBounded(raw, at, Number.MIN_VALUE, MAXIMUM_FRAME_RATE));
    const facingMode = read('facingMode', requireText);
    const resizeMode = read('resizeMode', (raw, at) => requireEnum(raw, at, RESIZE_MODES));
    const zoom = read('zoom', (raw, at) => requireBounded(raw, at, Number.MIN_VALUE, MAXIMUM_ZOOM));
    const focusMode = read('focusMode', (raw, at) => requireEnum(raw, at, FOCUS_MODES));
    const focusDistance = read('focusDistance', (raw, at) => requireBounded(raw, at, 0, MAXIMUM_FOCUS_DISTANCE));
    return {
        ...(frameRate === undefined ? {} : { frameRate }),
        ...(facingMode === undefined ? {} : { facingMode }),
        ...(resizeMode === undefined ? {} : { resizeMode }),
        ...(zoom === undefined ? {} : { zoom }),
        ...(focusMode === undefined ? {} : { focusMode }),
        ...(focusDistance === undefined ? {} : { focusDistance })
    };
}
function readQuality(value, path) {
    const record = requireRecord(value, path);
    requireExactKeys(record, path, ['sampleCount', 'reprojectionErrorPx']);
    return {
        sampleCount: requireInteger(record['sampleCount'], member(path, 'sampleCount'), 1, MAXIMUM_SAMPLE_COUNT),
        reprojectionErrorPx: requireBounded(record['reprojectionErrorPx'], member(path, 'reprojectionErrorPx'), 0, MAXIMUM_REPROJECTION_ERROR_PX)
    };
}
function readDevice(value, path) {
    const record = requireRecord(value, path);
    requireExactKeys(record, path, [], ['label', 'deviceId']);
    const label = 'label' in record ? requireText(record['label'], member(path, 'label')) : undefined;
    const deviceId = 'deviceId' in record ? requireText(record['deviceId'], member(path, 'deviceId')) : undefined;
    return {
        ...(label === undefined ? {} : { label }),
        ...(deviceId === undefined ? {} : { deviceId })
    };
}
function readProfile(input) {
    assertNoForbiddenKeys(input, '', 0, new WeakSet());
    const record = requireRecord(input, '');
    requireLiteral(record['schema'], 'schema', CAMERA_INTRINSIC_PROFILE_SCHEMA, 'unsupported-schema');
    requireLiteral(record['version'], 'version', CAMERA_INTRINSIC_PROFILE_VERSION, 'unsupported-version');
    requireExactKeys(record, '', [
        'schema',
        'version',
        'profileId',
        'cameraId',
        'calibratedAt',
        'producer',
        'cameraModel',
        'image',
        'intrinsics',
        'distortion'
    ], ['capture', 'quality', 'device']);
    const image = readImage(record['image'], 'image');
    const distortion = readDistortion(record['distortion'], 'distortion');
    if (image.undistorted && distortion.model !== 'none') {
        reject('inconsistent-profile', 'distortion.model', 'A profile for an already undistorted image cannot also carry distortion coefficients.');
    }
    const capture = 'capture' in record ? readCapture(record['capture'], 'capture') : undefined;
    const quality = 'quality' in record ? readQuality(record['quality'], 'quality') : undefined;
    const device = 'device' in record ? readDevice(record['device'], 'device') : undefined;
    return {
        schema: CAMERA_INTRINSIC_PROFILE_SCHEMA,
        version: CAMERA_INTRINSIC_PROFILE_VERSION,
        profileId: requireIdentifier(record['profileId'], 'profileId'),
        cameraId: requireIdentifier(record['cameraId'], 'cameraId'),
        calibratedAt: requireUtcTimestamp(record['calibratedAt'], 'calibratedAt'),
        producer: requireText(record['producer'], 'producer'),
        cameraModel: requireLiteral(record['cameraModel'], 'cameraModel', 'pinhole', 'invalid-value'),
        image,
        intrinsics: readIntrinsics(record['intrinsics'], 'intrinsics', image),
        distortion,
        ...(capture === undefined ? {} : { capture }),
        ...(quality === undefined ? {} : { quality }),
        ...(device === undefined ? {} : { device })
    };
}
function toResult(read) {
    try {
        return { ok: true, profile: read() };
    }
    catch (error) {
        if (error instanceof ProfileRejection)
            return { ok: false, error: error.detail };
        throw error;
    }
}
/**
 * Reads whichever profile format a document is written in.
 *
 * An operator holding a file does not know, and should not have to know, which of two schemas it
 * uses; they know they calibrated this camera once and kept the result. Dispatching on the document
 * itself means one entry point accepts both, and the profile that comes out records where it came
 * from in `producer`, so nothing about the conversion is hidden.
 *
 * Only the declared schema decides. A document that says nothing recognizable is refused by the
 * current parser, which names what it expected.
 */
export function readCameraProfileDocument(input) {
    if (isRecord(input) && input['schema'] === LEGACY_CALIBRATION_SCHEMA) {
        return adoptLegacyCameraCalibration(input);
    }
    return parseCameraIntrinsicProfile(input);
}
/** Validates a parsed document and returns a normalized profile, or the reason it was refused. */
export function parseCameraIntrinsicProfile(input) {
    return toResult(() => readProfile(input));
}
/** Validates profile JSON. Text that is not JSON at all is refused like any other invalid input. */
export function parseCameraIntrinsicProfileJson(text) {
    let parsed;
    try {
        parsed = JSON.parse(text);
    }
    catch {
        return {
            ok: false,
            error: { code: 'not-an-object', path: '', message: 'The profile is not valid JSON.' }
        };
    }
    return parseCameraIntrinsicProfile(parsed);
}
/**
 * Renders a profile as JSON with a fixed member order.
 *
 * Stable output means the same profile always produces the same bytes, so a file can be compared or
 * hashed to tell whether two machines really hold the same calibration.
 */
function orderedCapture(capture) {
    const members = [
        ['frameRate', capture.frameRate],
        ['facingMode', capture.facingMode],
        ['resizeMode', capture.resizeMode],
        ['zoom', capture.zoom],
        ['focusMode', capture.focusMode],
        ['focusDistance', capture.focusDistance]
    ];
    return Object.fromEntries(members.filter((entry) => entry[1] !== undefined));
}
export function serializeCameraIntrinsicProfile(profile) {
    const ordered = {
        schema: profile.schema,
        version: profile.version,
        profileId: profile.profileId,
        cameraId: profile.cameraId,
        calibratedAt: profile.calibratedAt,
        producer: profile.producer,
        cameraModel: profile.cameraModel,
        image: {
            width: profile.image.width,
            height: profile.image.height,
            undistorted: profile.image.undistorted
        },
        intrinsics: {
            fx: profile.intrinsics.fx,
            fy: profile.intrinsics.fy,
            cx: profile.intrinsics.cx,
            cy: profile.intrinsics.cy,
            skew: profile.intrinsics.skew
        },
        distortion: { model: profile.distortion.model, coefficients: [...profile.distortion.coefficients] },
        ...(profile.capture === undefined ? {} : { capture: orderedCapture(profile.capture) }),
        ...(profile.quality === undefined
            ? {}
            : {
                quality: {
                    sampleCount: profile.quality.sampleCount,
                    reprojectionErrorPx: profile.quality.reprojectionErrorPx
                }
            }),
        ...(profile.device === undefined
            ? {}
            : {
                device: {
                    ...(profile.device.label === undefined ? {} : { label: profile.device.label }),
                    ...(profile.device.deviceId === undefined ? {} : { deviceId: profile.device.deviceId })
                }
            })
    };
    return `${JSON.stringify(ordered, null, 2)}\n`;
}
function readLegacyMatrixRow(matrix, offset, expected) {
    expected.forEach((value, index) => {
        const actual = requireFinite(matrix[offset + index], `intrinsicMatrix[${offset + index}]`);
        if (Math.abs(actual - value) > AFFINE_ROW_TOLERANCE) {
            reject('inconsistent-profile', `intrinsicMatrix[${offset + index}]`, `Expected ${value} in the intrinsic matrix; the value read as ${actual}.`);
        }
    });
}
/**
 * Converts a `twrmc/camera-calibration` v1 document into this contract.
 *
 * The world pose the old format carried is deliberately dropped. It was the extrinsic of whichever
 * calibration sample happened to be last, so treating it as a placement in a shared world frame puts
 * a camera somewhere it has never been. Placement belongs to whoever solves it against a common
 * reference, and a profile that simply lacks it is honest about what it knows.
 *
 * Quality is dropped for the same reason: the old format recorded none, and inventing a sample count
 * or a reprojection error would turn "unknown" into a measurement.
 */
export function adoptLegacyCameraCalibration(input) {
    return toResult(() => {
        assertNoForbiddenKeys(input, '', 0, new WeakSet());
        const record = requireRecord(input, '');
        requireLiteral(record['schema'], 'schema', LEGACY_CALIBRATION_SCHEMA, 'unsupported-schema');
        requireLiteral(record['version'], 'version', 1, 'unsupported-version');
        requireExactKeys(record, '', [
            'schema',
            'version',
            'calibrationId',
            'cameraId',
            'imageWidth',
            'imageHeight',
            'intrinsicMatrix',
            'distortionCoefficients',
            'calibratedAt'
        ], ['worldFromCameraMatrix', 'worldUnit']);
        const matrix = record['intrinsicMatrix'];
        if (!Array.isArray(matrix) || matrix.length !== 9) {
            reject('invalid-value', 'intrinsicMatrix', 'Expected nine numbers in row-major order.');
        }
        readLegacyMatrixRow(matrix, 3, [0]);
        readLegacyMatrixRow(matrix, 6, [0, 0, 1]);
        const rawCoefficients = record['distortionCoefficients'];
        if (!Array.isArray(rawCoefficients)) {
            reject('invalid-type', 'distortionCoefficients', 'Expected an array.');
        }
        const model = rawCoefficients.length === 0 ? 'none' : 'brown-conrady';
        return readProfile({
            schema: CAMERA_INTRINSIC_PROFILE_SCHEMA,
            version: CAMERA_INTRINSIC_PROFILE_VERSION,
            profileId: record['calibrationId'],
            cameraId: record['cameraId'],
            calibratedAt: record['calibratedAt'],
            producer: `${LEGACY_CALIBRATION_SCHEMA} v1`,
            cameraModel: 'pinhole',
            image: {
                width: record['imageWidth'],
                height: record['imageHeight'],
                undistorted: false
            },
            intrinsics: {
                fx: matrix[0],
                fy: matrix[4],
                cx: matrix[2],
                cy: matrix[5],
                skew: matrix[1]
            },
            distortion: { model, coefficients: rawCoefficients }
        });
    });
}
//# sourceMappingURL=profile.js.map
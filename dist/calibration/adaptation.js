/** Aspect ratios are compared with a tolerance; reported sizes are whole pixels. */
const ASPECT_TOLERANCE = 1e-3;
export function adaptProfileToConditions(profile, conditions) {
    const { width: calibratedWidth, height: calibratedHeight } = profile.image;
    const { width, height } = conditions;
    if (width === 0 || height === 0) {
        return {
            state: 'unavailable',
            code: 'no-frame',
            width,
            height,
            scale: 1,
            detail: 'The camera has delivered no frame yet, so there is no size to adapt to.'
        };
    }
    if (width === calibratedWidth && height === calibratedHeight) {
        return {
            state: 'exact',
            code: 'exact',
            intrinsics: profile.intrinsics,
            width,
            height,
            scale: 1,
            detail: `The frame is ${width}x${height}, as calibrated.`
        };
    }
    if (profile.image.undistorted) {
        // The profile describes frames something upstream has already corrected.
        // Scaling its intrinsics would describe a correction of a different image.
        return {
            state: 'unavailable',
            code: 'undistorted-frames',
            width,
            height,
            scale: 1,
            detail: 'The profile describes already undistorted images, so it cannot be re-expressed for a different frame size here.'
        };
    }
    if (profile.capture?.resizeMode === 'crop-and-scale') {
        // The track may crop before it scales, which moves the principal point by
        // an amount nothing here reports. Guessing a pure scale would put the
        // optical centre in the wrong place and the error would look like a
        // slightly rotated camera rather than a mistake.
        return {
            state: 'unavailable',
            code: 'cropped',
            width,
            height,
            scale: 1,
            detail: 'The track was calibrated with crop-and-scale resizing, so a different frame size may be a crop rather than a scale and the principal point cannot be placed.'
        };
    }
    const scaleX = width / calibratedWidth;
    const scaleY = height / calibratedHeight;
    if (Math.abs(scaleX - scaleY) > ASPECT_TOLERANCE) {
        return {
            state: 'unavailable',
            code: 'aspect-changed',
            width,
            height,
            scale: 1,
            detail: `The calibrated ${calibratedWidth}x${calibratedHeight} and the current ${width}x${height} have different aspect ratios, so the difference is not a scale.`
        };
    }
    const scale = (scaleX + scaleY) / 2;
    return {
        state: 'scaled',
        code: 'uniform-scale',
        intrinsics: scaleIntrinsics(profile.intrinsics, scale),
        width,
        height,
        scale,
        detail: `The calibrated ${calibratedWidth}x${calibratedHeight} has been scaled by ${scale} to the current ${width}x${height}.`
    };
}
export function scaleIntrinsics(intrinsics, scale) {
    return {
        fx: intrinsics.fx * scale,
        fy: intrinsics.fy * scale,
        cx: intrinsics.cx * scale,
        cy: intrinsics.cy * scale,
        // Skew is a ratio between the axes, so a uniform scale leaves it alone.
        skew: intrinsics.skew
    };
}
/**
 * The intrinsics to use, if there are any.
 *
 * Both conditions have to hold, and they are different questions. Compatibility asks whether this
 * profile describes this camera as it is configured now; adaptation asks whether the numbers can be
 * expressed for the frame size in front of us. A profile can fit the camera and still have no usable
 * form — a crop, say — and it can adapt cleanly while belonging to a different camera entirely.
 *
 * Returning undefined rather than the stored numbers is the whole point. Intrinsics from another
 * configuration do not fail visibly: they project, and the geometry that comes back looks like a
 * slightly different camera pose rather than like a mistake.
 */
export function usableIntrinsics(compatibility, adaptation) {
    if (compatibility.state !== 'compatible')
        return undefined;
    if (adaptation.intrinsics === undefined)
        return undefined;
    return {
        ...adaptation.intrinsics,
        width: adaptation.width,
        height: adaptation.height,
        scale: adaptation.scale,
        adaptation: adaptation.state
    };
}
//# sourceMappingURL=adaptation.js.map
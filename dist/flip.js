export const FLIPS = ['none', 'horizontal', 'vertical', 'both'];
export function isFlip(value) {
    return typeof value === 'string' && FLIPS.includes(value);
}
/** Reads a flip, accepting the boolean the older API used for left-right. */
export function toFlip(value, fallback = 'none') {
    if (isFlip(value))
        return value;
    if (value === true)
        return 'horizontal';
    if (value === false)
        return 'none';
    return fallback;
}
export function flipsHorizontally(flip) {
    return flip === 'horizontal' || flip === 'both';
}
export function flipsVertically(flip) {
    return flip === 'vertical' || flip === 'both';
}
/** Combines two flips; flipping the same axis twice returns it to none. */
export function combineFlips(left, right) {
    const horizontal = flipsHorizontally(left) !== flipsHorizontally(right);
    const vertical = flipsVertically(left) !== flipsVertically(right);
    if (horizontal && vertical)
        return 'both';
    if (horizontal)
        return 'horizontal';
    if (vertical)
        return 'vertical';
    return 'none';
}
//# sourceMappingURL=flip.js.map
import {describe, expect, it} from 'vitest';
import {combineFlips, flipsHorizontally, flipsVertically, isFlip, toFlip} from '../src/flip.js';

describe('the flip vocabulary', () => {
  it('names the axis, which a boolean could not', () => {
    expect(isFlip('horizontal')).toBe(true);
    expect(isFlip('vertical')).toBe(true);
    expect(isFlip('mirrored')).toBe(false);
  });

  it('reads the boolean the older API used as a left-right flip', () => {
    expect(toFlip(true)).toBe('horizontal');
    expect(toFlip(false)).toBe('none');
  });

  it('falls back rather than inventing a flip from nonsense', () => {
    expect(toFlip('sideways')).toBe('none');
    expect(toFlip(undefined, 'horizontal')).toBe('horizontal');
  });

  it('answers which axes a flip turns over', () => {
    expect(flipsHorizontally('both')).toBe(true);
    expect(flipsVertically('both')).toBe(true);
    expect(flipsHorizontally('vertical')).toBe(false);
  });

  it('cancels a flip applied twice', () => {
    // A preview mirrored on top of already mirrored pixels shows the original.
    expect(combineFlips('horizontal', 'horizontal')).toBe('none');
    expect(combineFlips('horizontal', 'vertical')).toBe('both');
    expect(combineFlips('both', 'horizontal')).toBe('vertical');
  });
});

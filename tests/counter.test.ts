import { describe, it, expect } from 'vitest';
import { easeOutExpo, formatNumber, interpolate } from '~/scripts/utils/counter';

describe('easeOutExpo', () => {
  it('returns 0 at t=0', () => { expect(easeOutExpo(0)).toBe(0); });
  it('returns 1 at t=1', () => { expect(easeOutExpo(1)).toBe(1); });
  it('is monotonically increasing in (0,1)', () => {
    let last = 0;
    for (let t = 0.1; t < 1; t += 0.1) {
      const v = easeOutExpo(t);
      expect(v).toBeGreaterThan(last);
      last = v;
    }
  });
});

describe('interpolate', () => {
  it('at t=0 returns from', () => { expect(interpolate(0, 10, 0)).toBe(0); });
  it('at t=1 returns to', () => { expect(interpolate(0, 10, 1)).toBe(10); });
  it('handles negative ranges', () => { expect(interpolate(10, 0, 0.5)).toBeLessThan(10); });
});

describe('formatNumber', () => {
  it('formats integers with comma separators', () => { expect(formatNumber(5000)).toBe('5,000'); });
  it('strips trailing zeros for floats', () => { expect(formatNumber(46)).toBe('46'); });
  it('appends suffix when provided', () => { expect(formatNumber(5000, { suffix: '+' })).toBe('5,000+'); });
});

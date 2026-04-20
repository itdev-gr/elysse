import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prefersReducedMotion, onReducedMotionChange } from '~/scripts/utils/reducedMotion';

describe('prefersReducedMotion', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('reduce'),
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));
  });

  it('returns true when media query matches reduce', () => {
    expect(prefersReducedMotion()).toBe(true);
  });

  it('returns false when media query does not match', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    expect(prefersReducedMotion()).toBe(false);
  });

  it('onReducedMotionChange calls callback with current state on registration', () => {
    const cb = vi.fn();
    onReducedMotionChange(cb);
    expect(cb).toHaveBeenCalledWith(true);
  });
});

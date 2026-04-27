import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readCountry, writeCountry } from '~/scripts/catalog/country';

describe('country storage', () => {
  beforeEach(() => { localStorage.clear(); });

  it('returns null when nothing stored', () => {
    expect(readCountry()).toBeNull();
  });

  it('round-trips a valid country', () => {
    writeCountry('country-2');
    expect(readCountry()).toBe('country-2');
  });

  it('returns null for an invalid stored value', () => {
    localStorage.setItem('elysee.country', 'not-a-country');
    expect(readCountry()).toBeNull();
  });

  it('returns null when localStorage getter throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    try { expect(readCountry()).toBeNull(); }
    finally { spy.mockRestore(); }
  });

  it('swallows errors from setItem (does not throw)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    try { expect(() => writeCountry('country-1')).not.toThrow(); }
    finally { spy.mockRestore(); }
  });
});

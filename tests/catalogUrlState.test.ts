import { describe, it, expect } from 'vitest';
import { encodeFilters, decodeFilters } from '~/scripts/catalog/url-state';
import { EMPTY_FILTERS, type Filters } from '~/scripts/catalog/types';

describe('url-state', () => {
  it('round-trips empty filters to empty string', () => {
    expect(encodeFilters(EMPTY_FILTERS)).toBe('');
  });

  it('round-trips sectors and categories', () => {
    const f: Filters = { ...EMPTY_FILTERS, sectors: ['agriculture', 'industry'], categories: ['valves'] };
    const encoded = encodeFilters(f);
    expect(encoded).toContain('sectors=agriculture%2Cindustry');
    expect(encoded).toContain('categories=valves');
    expect(decodeFilters(encoded)).toEqual(f);
  });

  it('round-trips numeric ranges', () => {
    const f: Filters = { ...EMPTY_FILTERS, dn: [20, 110], pn: [10, 16] };
    const encoded = encodeFilters(f);
    expect(decodeFilters(encoded)).toEqual(f);
  });

  it('round-trips boolean flags', () => {
    const f: Filters = { ...EMPTY_FILTERS, hasDatasheet: true, bimAvailable: true };
    expect(decodeFilters(encodeFilters(f))).toEqual(f);
  });

  it('round-trips search term with encoded special characters', () => {
    const f: Filters = { ...EMPTY_FILTERS, search: 'NO330D & friends' };
    expect(decodeFilters(encodeFilters(f)).search).toBe('NO330D & friends');
  });

  it('decodes unknown sectors as empty (defensive)', () => {
    const result = decodeFilters('sectors=banana,industry');
    expect(result.sectors).toEqual(['industry']);
  });
});

import { describe, it, expect } from 'vitest';
import { deriveFacets } from '~/scripts/catalog/derive-facets';
import type { CatalogProduct } from '~/scripts/catalog/types';

const product = (overrides: Partial<CatalogProduct>): CatalogProduct => ({
  slug: 'x', name: 'X', categorySlug: 'valves', sectors: [], standards: [], imageUrls: [],
  image: '', blurb: '', pressure: '', sizeRange: '', bim: false, specs: [], featured: false,
  availableCountries: ['country-1', 'country-2', 'country-3'],
  ...overrides
});

describe('deriveFacets', () => {
  it('counts sectors across products', () => {
    const ps = [
      product({ sectors: ['agriculture', 'landscape'] }),
      product({ sectors: ['agriculture'] }),
      product({ sectors: ['industry'] })
    ];
    const f = deriveFacets(ps);
    expect(f.sectors).toEqual([
      { value: 'agriculture', count: 2 },
      { value: 'landscape', count: 1 },
      { value: 'industry', count: 1 }
    ]);
  });

  it('uniques materials and sorts alphabetically', () => {
    const ps = [
      product({ material: 'PVC-U' }),
      product({ material: 'POM' }),
      product({ material: 'PVC-U' })
    ];
    expect(deriveFacets(ps).materials).toEqual([
      { value: 'POM', count: 1 },
      { value: 'PVC-U', count: 2 }
    ]);
  });

  it('uniques standards', () => {
    const ps = [
      product({ standards: ['EN 1452', 'ISO 17885'] }),
      product({ standards: ['EN 1452'] })
    ];
    expect(deriveFacets(ps).standards).toEqual([
      { value: 'EN 1452', count: 2 },
      { value: 'ISO 17885', count: 1 }
    ]);
  });

  it('computes DN min/max', () => {
    const ps = [
      product({ dnRange: [20, 110] }),
      product({ dnRange: [16, 50] }),
      product({})
    ];
    expect(deriveFacets(ps).dn).toEqual({ min: 16, max: 110 });
  });

  it('returns null DN when no product has dnRange', () => {
    expect(deriveFacets([product({})]).dn).toBeNull();
  });

  it('computes PN min/max', () => {
    const ps = [product({ pnRating: 10 }), product({ pnRating: 16 }), product({})];
    expect(deriveFacets(ps).pn).toEqual({ min: 10, max: 16 });
  });
});

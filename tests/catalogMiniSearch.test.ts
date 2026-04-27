import { describe, it, expect } from 'vitest';
import { search } from '~/scripts/catalog/mini-search';
import type { CatalogProduct } from '~/scripts/catalog/types';

const product = (overrides: Partial<CatalogProduct>): CatalogProduct => ({
  slug: 'x', name: 'X', category: 'valves', sectors: [], standards: [], imageUrls: [],
  image: '', blurb: '', pressure: '', sizeRange: '', bim: false, specs: [], featured: false,
  ...overrides
});

const products: CatalogProduct[] = [
  product({ slug: 'a', name: 'Adaptor Flanged Set', code: 'NO330D', blurb: 'Flanged adaptor for PVC' }),
  product({ slug: 'b', name: 'Ball Valve', code: 'PVC-BV-50', specs: [{ key: 'Material', value: 'PVC-U body' }] }),
  product({ slug: 'c', name: 'Coupling Repair', code: 'NO331B' })
];

describe('mini-search', () => {
  it('returns all products for empty query', () => {
    expect(search(products, '').map(p => p.slug)).toEqual(['a', 'b', 'c']);
  });
  it('finds by exact code', () => {
    expect(search(products, 'NO330D').map(p => p.slug)).toEqual(['a']);
  });
  it('finds by code prefix', () => {
    expect(search(products, 'NO33').map(p => p.slug).sort()).toEqual(['a', 'c']);
  });
  it('finds by name (case-insensitive)', () => {
    expect(search(products, 'BALL').map(p => p.slug)).toEqual(['b']);
  });
  it('finds by spec value', () => {
    expect(search(products, 'PVC-U').map(p => p.slug)).toEqual(['b']);
  });
  it('finds by blurb', () => {
    expect(search(products, 'Flanged adaptor').map(p => p.slug)).toEqual(['a']);
  });
  it('returns empty for no match', () => {
    expect(search(products, 'zzz')).toEqual([]);
  });
});

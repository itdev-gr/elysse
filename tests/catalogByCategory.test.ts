import { describe, it, expect } from 'vitest';
import { byCategory } from '~/scripts/catalog/filter-engine';
import type { CatalogProduct, CategorySlug } from '~/scripts/catalog/types';

const make = (slug: string, categorySlug: CategorySlug): CatalogProduct => ({
  slug,
  name: slug,
  category: 'valves' as any, // legacy field — removed in Task 3
  categorySlug,
  sectors: [],
  standards: [],
  imageUrls: [],
  image: '',
  blurb: '',
  pressure: '',
  sizeRange: '',
  bim: false,
  specs: [],
  featured: false,
  availableCountries: ['country-1', 'country-2', 'country-3'],
} as unknown as CatalogProduct);

describe('byCategory', () => {
  const products: CatalogProduct[] = [
    make('a', 'compression-fittings'),
    make('b', 'compression-fittings'),
    make('c', 'valves'),
    make('d', 'saddles'),
  ];

  it('returns only products in the given category', () => {
    expect(byCategory(products, 'compression-fittings').map(p => p.slug)).toEqual(['a', 'b']);
    expect(byCategory(products, 'valves').map(p => p.slug)).toEqual(['c']);
    expect(byCategory(products, 'saddles').map(p => p.slug)).toEqual(['d']);
  });

  it('returns empty array when no products in category', () => {
    expect(byCategory(products, 'turf')).toEqual([]);
  });
});

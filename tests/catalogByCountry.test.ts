import { describe, it, expect } from 'vitest';
import { byCountry } from '~/scripts/catalog/filter-engine';
import type { CatalogProduct, Country } from '~/scripts/catalog/types';

const make = (slug: string, countries: Country[]): CatalogProduct => ({
  slug,
  name: slug,
  category: 'valves',
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
  availableCountries: countries,
});

describe('byCountry', () => {
  const products: CatalogProduct[] = [
    make('a', ['country-1']),
    make('b', ['country-1', 'country-2']),
    make('c', ['country-2', 'country-3']),
    make('d', ['country-3']),
  ];

  it('returns only products available in the country', () => {
    expect(byCountry(products, 'country-1').map(p => p.slug)).toEqual(['a', 'b']);
    expect(byCountry(products, 'country-2').map(p => p.slug)).toEqual(['b', 'c']);
    expect(byCountry(products, 'country-3').map(p => p.slug)).toEqual(['c', 'd']);
  });

  it('returns empty array when no product available', () => {
    const none: CatalogProduct[] = [make('x', ['country-1'])];
    expect(byCountry(none, 'country-3')).toEqual([]);
  });
});

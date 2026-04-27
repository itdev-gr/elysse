import { describe, it, expect } from 'vitest';
import { applyFilters, sortProducts } from '~/scripts/catalog/filter-engine';
import { EMPTY_FILTERS, type Filters, type CatalogProduct } from '~/scripts/catalog/types';

const product = (overrides: Partial<CatalogProduct>): CatalogProduct => ({
  slug: 'x', name: 'X', category: 'valves', sectors: [], standards: [], imageUrls: [],
  image: '', blurb: '', pressure: '', sizeRange: '', bim: false, specs: [], featured: false,
  ...overrides
});

const ps: CatalogProduct[] = [
  product({ slug: 'a', name: 'A', code: 'A1', sectors: ['agriculture'], category: 'valves',           pnRating: 16, dnRange: [20, 50],  standards: ['EN 1452'], material: 'PVC-U' }),
  product({ slug: 'b', name: 'B', code: 'B1', sectors: ['industry'],    category: 'compression-fittings', pnRating: 10, dnRange: [50, 110], standards: ['ISO 17885'], material: 'POM',   bim: true,  datasheet: '/x.pdf' }),
  product({ slug: 'c', name: 'C', code: 'C1', sectors: ['landscape'],   category: 'valves',           pnRating: 16, dnRange: [16, 32],  standards: ['EN 1452'], material: 'PVC-U' })
];

describe('applyFilters', () => {
  it('returns all with empty filters', () => {
    expect(applyFilters(ps, EMPTY_FILTERS).map(p => p.slug)).toEqual(['a', 'b', 'c']);
  });
  it('filters by sector (OR within facet)', () => {
    expect(applyFilters(ps, { ...EMPTY_FILTERS, sectors: ['agriculture', 'industry'] }).map(p => p.slug).sort()).toEqual(['a', 'b']);
  });
  it('filters by category', () => {
    expect(applyFilters(ps, { ...EMPTY_FILTERS, categories: ['valves'] }).map(p => p.slug).sort()).toEqual(['a', 'c']);
  });
  it('AND across facets', () => {
    expect(applyFilters(ps, { ...EMPTY_FILTERS, sectors: ['agriculture'], categories: ['valves'] }).map(p => p.slug)).toEqual(['a']);
  });
  it('range filter on PN', () => {
    expect(applyFilters(ps, { ...EMPTY_FILTERS, pn: [16, 16] }).map(p => p.slug).sort()).toEqual(['a', 'c']);
  });
  it('range filter on DN (overlap)', () => {
    expect(applyFilters(ps, { ...EMPTY_FILTERS, dn: [40, 60] }).map(p => p.slug).sort()).toEqual(['a', 'b']);
  });
  it('filters by material (OR)', () => {
    expect(applyFilters(ps, { ...EMPTY_FILTERS, materials: ['POM'] }).map(p => p.slug)).toEqual(['b']);
  });
  it('filters by standard (OR)', () => {
    expect(applyFilters(ps, { ...EMPTY_FILTERS, standards: ['EN 1452'] }).map(p => p.slug).sort()).toEqual(['a', 'c']);
  });
  it('filters by hasDatasheet', () => {
    expect(applyFilters(ps, { ...EMPTY_FILTERS, hasDatasheet: true }).map(p => p.slug)).toEqual(['b']);
  });
  it('filters by bimAvailable', () => {
    expect(applyFilters(ps, { ...EMPTY_FILTERS, bimAvailable: true }).map(p => p.slug)).toEqual(['b']);
  });
  it('combines search with filters', () => {
    expect(applyFilters(ps, { ...EMPTY_FILTERS, search: 'B1', sectors: ['industry'] }).map(p => p.slug)).toEqual(['b']);
  });
});

describe('sortProducts', () => {
  it('relevance keeps original order', () => {
    expect(sortProducts(ps, 'relevance').map(p => p.slug)).toEqual(['a', 'b', 'c']);
  });
  it('name-asc sorts alphabetically', () => {
    const out = sortProducts([...ps].reverse(), 'name-asc');
    expect(out.map(p => p.name)).toEqual(['A', 'B', 'C']);
  });
  it('pressure-desc sorts by pnRating descending; missing last', () => {
    const mixed = [...ps, product({ slug: 'd', name: 'D', pnRating: undefined })];
    expect(sortProducts(mixed, 'pressure-desc').map(p => p.slug)).toEqual(['a', 'c', 'b', 'd']);
  });
});

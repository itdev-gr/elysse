import type { CatalogProduct, CategorySlug, Country, Filters, SortKey } from './types';
import { search } from './mini-search';

function rangesOverlap(a: [number, number], b: [number, number]): boolean {
  return a[0] <= b[1] && b[0] <= a[1];
}

export function byCountry(products: CatalogProduct[], country: Country): CatalogProduct[] {
  return products.filter(p => p.availableCountries.includes(country));
}

export function byCategory(products: CatalogProduct[], category: CategorySlug): CatalogProduct[] {
  return products.filter(p => p.categorySlug === category);
}

export function applyFilters(products: CatalogProduct[], f: Filters): CatalogProduct[] {
  let out = search(products, f.search);
  if (f.sectors.length)    out = out.filter(p => p.sectors.some(s => f.sectors.includes(s)));
  if (f.categories.length) out = out.filter(p => f.categories.includes(p.category));
  if (f.materials.length)  out = out.filter(p => p.material && f.materials.includes(p.material));
  if (f.standards.length)  out = out.filter(p => p.standards.some(s => f.standards.includes(s)));
  if (f.dn)                out = out.filter(p => p.dnRange && rangesOverlap(p.dnRange, f.dn!));
  if (f.pn)                out = out.filter(p => p.pnRating !== undefined && p.pnRating >= f.pn![0] && p.pnRating <= f.pn![1]);
  if (f.hasDatasheet)      out = out.filter(p => !!p.datasheet);
  if (f.bimAvailable)      out = out.filter(p => p.bim);
  return out;
}

export function sortProducts(products: CatalogProduct[], key: SortKey): CatalogProduct[] {
  const arr = [...products];
  switch (key) {
    case 'name-asc':       return arr.sort((a, b) => a.name.localeCompare(b.name));
    case 'pressure-desc':  return arr.sort((a, b) => (b.pnRating ?? -Infinity) - (a.pnRating ?? -Infinity));
    case 'newest':         return arr.sort((a, b) => Number(b.featured) - Number(a.featured));
    case 'relevance':
    default:               return arr;
  }
}

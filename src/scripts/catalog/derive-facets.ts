import type { CatalogProduct, Sector, Category } from './types';

export interface FacetCount<T> { value: T; count: number; }
export interface RangeFacet { min: number; max: number; }

export interface DerivedFacets {
  sectors: FacetCount<Sector>[];
  categories: FacetCount<Category>[];
  materials: FacetCount<string>[];
  standards: FacetCount<string>[];
  dn: RangeFacet | null;
  pn: RangeFacet | null;
}

/** Count occurrences, preserve insertion order among ties (sort by count desc only). */
function tally<T extends string>(items: T[][]): FacetCount<T>[] {
  const map = new Map<T, number>();
  for (const arr of items) for (const v of arr) map.set(v, (map.get(v) ?? 0) + 1);
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, count }));
}

/** Count occurrences, sort alphabetically by value. */
function tallyAlpha<T extends string>(items: T[][]): FacetCount<T>[] {
  const map = new Map<T, number>();
  for (const arr of items) for (const v of arr) map.set(v, (map.get(v) ?? 0) + 1);
  return [...map.entries()]
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    .map(([value, count]) => ({ value, count }));
}

function range(values: number[]): RangeFacet | null {
  if (!values.length) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}

export function deriveFacets(products: CatalogProduct[]): DerivedFacets {
  const dnValues = products.flatMap(p => p.dnRange ? [p.dnRange[0], p.dnRange[1]] : []);
  const pnValues = products.flatMap(p => p.pnRating !== undefined ? [p.pnRating] : []);
  return {
    sectors: tally(products.map(p => p.sectors)),
    categories: tally(products.map(p => [p.category])),
    materials: tallyAlpha(products.flatMap(p => p.material ? [[p.material]] : [])),
    standards: tally(products.map(p => p.standards)),
    dn: range(dnValues),
    pn: range(pnValues)
  };
}

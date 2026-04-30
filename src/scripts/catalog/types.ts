export type Sector = 'agriculture' | 'landscape' | 'building' | 'industry';

export type Country = 'country-1' | 'country-2' | 'country-3';

export const COUNTRIES: ReadonlyArray<{ id: Country; label: string }> = [
  { id: 'country-1', label: 'Country 1' },
  { id: 'country-2', label: 'Country 2' },
  { id: 'country-3', label: 'Country 3' },
] as const;

export type CategorySlug =
  | 'compression-fittings' | 'hydraulic-fittings' | 'saddles'
  | 'light-weight-fittings' | 'valves' | 'filters-and-dosers'
  | 'micro-irrigation-and-sprinklers' | 'turf' | 'polyethylene-pipes'
  | 'pvc-pressure-pipes-and-fittings' | 'network-drainage'
  | 'cable-applications' | 'building-sewerage';

export const CATEGORY_SLUGS: ReadonlyArray<CategorySlug> = [
  'compression-fittings', 'hydraulic-fittings', 'saddles',
  'light-weight-fittings', 'valves', 'filters-and-dosers',
  'micro-irrigation-and-sprinklers', 'turf', 'polyethylene-pipes',
  'pvc-pressure-pipes-and-fittings', 'network-drainage',
  'cable-applications', 'building-sewerage'
] as const;

export interface CatalogProduct {
  slug: string;
  name: string;
  code?: string;
  categorySlug: CategorySlug;
  sectors: Sector[];
  material?: string;
  dnRange?: [number, number];
  pnRating?: number;
  standards: string[];
  imageUrls: string[];
  image: string;
  blurb: string;
  pressure: string;
  sizeRange: string;
  bim: boolean;
  datasheet?: string;
  installation?: string;
  specs: { key: string; value: string }[];
  featured: boolean;
  availableCountries: Country[];
}

export interface Filters {
  search: string;
  sectors: Sector[];
  materials: string[];
  standards: string[];
  dn?: [number, number];
  pn?: [number, number];
  hasDatasheet: boolean;
  bimAvailable: boolean;
}

export const EMPTY_FILTERS: Filters = {
  search: '',
  sectors: [],
  materials: [],
  standards: [],
  hasDatasheet: false,
  bimAvailable: false
};

export type SortKey = 'relevance' | 'name-asc' | 'pressure-desc' | 'newest';

export interface BasketItem {
  slug: string;
  code?: string;
  name: string;
  thumb: string;
  qty: number;
}

export type Sector = 'agriculture' | 'landscape' | 'building' | 'industry';
export type Category = 'compression-fittings' | 'pvc-ball-valves' | 'saddles' | 'adaptor-flanged' | 'couplings' | 'valves';

export type Country = 'country-1' | 'country-2' | 'country-3';

export const COUNTRIES: ReadonlyArray<{ id: Country; label: string }> = [
  { id: 'country-1', label: 'Country 1' },
  { id: 'country-2', label: 'Country 2' },
  { id: 'country-3', label: 'Country 3' },
] as const;

export interface CatalogProduct {
  slug: string;
  name: string;
  code?: string;
  category: Category;
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
  categories: Category[];
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
  categories: [],
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

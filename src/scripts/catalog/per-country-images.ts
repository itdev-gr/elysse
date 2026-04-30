// Per-country product image lookup. Demo-only: real data later comes from
// per-product MDX fields. Keys are product slugs.

import type { Country } from './types';

export type ImagesByCountry = Partial<Record<Country, string>> & {
  'country-1': string;
  'country-2': string;
};

const PER_COUNTRY_IMAGES: Record<string, ImagesByCountry> = {
  'coupling-epsilon-pn16': {
    'country-1': '/images/products/coupling-epsilon-pn16-elysee.png',
    'country-2': '/images/products/coupling-epsilon-pn16-rohrsysteme.png'
  },
  'coupling-transition': {
    'country-1': '/images/products/coupling-transition-elysee.png',
    'country-2': '/images/products/coupling-transition-rohrsysteme.png'
  }
};

export function imagesForProduct(slug: string): ImagesByCountry | undefined {
  return PER_COUNTRY_IMAGES[slug];
}

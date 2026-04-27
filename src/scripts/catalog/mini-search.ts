import type { CatalogProduct } from './types';

function haystack(p: CatalogProduct): string {
  return [
    p.name,
    p.code ?? '',
    p.blurb,
    p.material ?? '',
    p.standards.join(' '),
    p.specs.map(s => `${s.key} ${s.value}`).join(' ')
  ].join(' ').toLowerCase();
}

export function search(products: CatalogProduct[], query: string): CatalogProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter(p => haystack(p).includes(q));
}

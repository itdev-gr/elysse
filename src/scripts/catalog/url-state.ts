import type { Filters, Sector } from './types';

const SECTORS: Sector[] = ['agriculture', 'landscape', 'building', 'industry'];

export function encodeFilters(f: Filters): string {
  const params = new URLSearchParams();
  if (f.search) params.set('q', f.search);
  if (f.sectors.length) params.set('sectors', f.sectors.join(','));
  if (f.materials.length) params.set('materials', f.materials.join(','));
  if (f.standards.length) params.set('standards', f.standards.join(','));
  if (f.dn) params.set('dn', `${f.dn[0]}-${f.dn[1]}`);
  if (f.pn) params.set('pn', `${f.pn[0]}-${f.pn[1]}`);
  if (f.hasDatasheet) params.set('ds', '1');
  if (f.bimAvailable) params.set('bim', '1');
  return params.toString();
}

function parseRange(v: string | null): [number, number] | undefined {
  if (!v) return undefined;
  const [a, b] = v.split('-').map(Number);
  return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : undefined;
}

function parseList<T extends string>(v: string | null, allowed: readonly T[]): T[] {
  if (!v) return [];
  return v.split(',').filter((x): x is T => (allowed as readonly string[]).includes(x));
}

export function decodeFilters(qs: string): Filters {
  const params = new URLSearchParams(qs);
  return {
    search: params.get('q') ?? '',
    sectors: parseList(params.get('sectors'), SECTORS),
    materials: params.get('materials')?.split(',').filter(Boolean) ?? [],
    standards: params.get('standards')?.split(',').filter(Boolean) ?? [],
    dn: parseRange(params.get('dn')),
    pn: parseRange(params.get('pn')),
    hasDatasheet: params.get('ds') === '1',
    bimAvailable: params.get('bim') === '1'
  };
}

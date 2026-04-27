import type { Sector } from './types';

export function formatDN(r: [number, number]): string {
  return r[0] === r[1] ? `DN ${r[0]}` : `DN ${r[0]}–${r[1]}`;
}
export function formatPN(n: number): string { return `PN ${n}`; }
export function formatSectorList(s: Sector[]): string {
  return s.map(x => x[0].toUpperCase() + x.slice(1)).join(' · ');
}

import { describe, it, expect } from 'vitest';
import { applyFilters, byCountry, sortProducts } from '~/scripts/catalog/filter-engine';
import { deriveFacets } from '~/scripts/catalog/derive-facets';
import { encodeFilters, decodeFilters } from '~/scripts/catalog/url-state';
import { EMPTY_FILTERS, type CatalogProduct } from '~/scripts/catalog/types';

const demo: CatalogProduct[] = [
  { slug: 'epsilon',             name: 'Epsilon Series',           code: 'EPS-PE-001', category: 'compression-fittings', sectors: ['agriculture','landscape'],            material: 'POM body / EPDM seal',                       dnRange: [20, 110],  pnRating: 16, standards: ['ISO 17885','WRAS','KIWA'], imageUrls: [], image: '', blurb: '', pressure: '16 bar',  sizeRange: 'Ø20–Ø110',  bim: true,  specs: [], featured: true,  availableCountries: ['country-1','country-2'] },
  { slug: 'adaptor-flanged',     name: 'Adaptor Flanged Set',      code: 'NO330D',     category: 'adaptor-flanged',      sectors: ['building','industry'],                material: 'PVC-U flange / EPDM gasket',                 dnRange: [50, 160],  pnRating: 16, standards: ['EN 1452','DIN 8061'],      imageUrls: [], image: '', blurb: '', pressure: '',        sizeRange: '',          bim: false, specs: [], featured: false, availableCountries: ['country-2'] },
  { slug: 'coupling-repair',     name: 'Coupling Repair',          code: 'NO331B',     category: 'couplings',            sectors: ['agriculture','building'],             material: 'PP body / EPDM seal',                        dnRange: [20, 110],  pnRating: 16, standards: ['ISO 14236'],               imageUrls: [], image: '', blurb: '', pressure: '',        sizeRange: '',          bim: false, specs: [], featured: false, availableCountries: ['country-1'] },
  { slug: 'coupling-transition', name: 'Coupling Global Transition', code: 'NO321D',  category: 'couplings',            sectors: ['agriculture','landscape','building'], material: 'PP body / brass insert / EPDM seal',         dnRange: [20, 63],   pnRating: 16, standards: ['ISO 14236'],               imageUrls: [], image: '', blurb: '', pressure: '',        sizeRange: '',          bim: false, specs: [], featured: false, availableCountries: ['country-2'] },
  { slug: 'single-4-bolts',      name: 'Single 4-bolts Flange',    code: 'NO550V',     category: 'adaptor-flanged',      sectors: ['building','industry'],                material: 'Ductile iron flange / EPDM gasket / steel bolts', dnRange: [110, 315], pnRating: 10, standards: ['EN 1092-1'],            imageUrls: [], image: '', blurb: '', pressure: '',        sizeRange: '',          bim: false, specs: [], featured: false, availableCountries: ['country-2','country-3'] },
  { slug: 'double-union-glued',  name: 'Double Union Glued',       code: 'NO108F',     category: 'valves',               sectors: ['building','industry'],                material: 'PVC-U body / EPDM o-rings',                  dnRange: [20, 63],   pnRating: 16, standards: ['EN 1452'],                 imageUrls: [], image: '', blurb: '', pressure: '',        sizeRange: '',          bim: false, specs: [], featured: false, availableCountries: ['country-1'] },
  { slug: 'pvc-ball-valve',      name: 'PVC Ball Valve',           code: 'PVC-BV-50',  category: 'pvc-ball-valves',      sectors: ['building','landscape'],               material: 'PVC-U body / PTFE seat / EPDM o-ring',       dnRange: [20, 110],  pnRating: 16, standards: ['EN 1452','DIN 8061'],      imageUrls: [], image: '', blurb: '', pressure: '',        sizeRange: '',          bim: false, specs: [], featured: false, availableCountries: ['country-1','country-3'] },
  { slug: 'saddle-clamp',        name: 'Saddle Clamp',             code: 'SDL-CL-32',  category: 'saddles',              sectors: ['agriculture','landscape','industry'], material: 'PP saddle / EPDM gasket / stainless bolts',  dnRange: [63, 315],  pnRating: 16, standards: ['ISO 8085'],                imageUrls: [], image: '', blurb: '', pressure: '',        sizeRange: '',          bim: false, specs: [], featured: false, availableCountries: ['country-1','country-3'] }
];

describe('catalog integration', () => {
  it('demo set has 8 products', () => {
    expect(demo.length).toBe(8);
  });
  it('agriculture filter keeps the agricultural products', () => {
    const out = applyFilters(demo, { ...EMPTY_FILTERS, sectors: ['agriculture'] });
    expect(out.map(p => p.slug).sort()).toEqual(['coupling-repair','coupling-transition','epsilon','saddle-clamp']);
  });
  it('PN 10 narrows to single-4-bolts only', () => {
    const out = applyFilters(demo, { ...EMPTY_FILTERS, pn: [10, 10] });
    expect(out.map(p => p.slug)).toEqual(['single-4-bolts']);
  });
  it('search by partial code finds adaptor', () => {
    const out = applyFilters(demo, { ...EMPTY_FILTERS, search: 'NO330' });
    expect(out.map(p => p.slug)).toEqual(['adaptor-flanged']);
  });
  it('derived facets count standards correctly', () => {
    const f = deriveFacets(demo);
    const en1452 = f.standards.find(s => s.value === 'EN 1452');
    expect(en1452?.count).toBe(3);
  });
  it('URL round-trip with multiple facets', () => {
    const f = { ...EMPTY_FILTERS, sectors: ['agriculture' as const], pn: [16, 16] as [number, number] };
    expect(decodeFilters(encodeFilters(f))).toEqual(f);
  });
  it('sort by name-asc produces alphabetical order', () => {
    const out = sortProducts([...demo], 'name-asc');
    expect(out[0].name).toBe('Adaptor Flanged Set');
    expect(out[out.length - 1].name).toBe('Single 4-bolts Flange');
  });
  it('country-3 narrows the demo set to 3 products', () => {
    const out = byCountry(demo, 'country-3');
    expect(out.map(p => p.slug).sort()).toEqual(['pvc-ball-valve', 'saddle-clamp', 'single-4-bolts']);
  });
  it('facets re-derived from country-3 set reflect only those products', () => {
    const scoped = byCountry(demo, 'country-3');
    const f = deriveFacets(scoped);
    // EN 1452 is on pvc-ball-valve only in this scoped set (saddle has ISO 8085, single-4-bolts has EN 1092-1)
    const en1452 = f.standards.find(s => s.value === 'EN 1452');
    expect(en1452?.count).toBe(1);
    // Categories present in the scoped set: pvc-ball-valves, saddles, adaptor-flanged
    const cats = f.categories.map(c => c.value).sort();
    expect(cats).toEqual(['adaptor-flanged', 'pvc-ball-valves', 'saddles']);
  });
});

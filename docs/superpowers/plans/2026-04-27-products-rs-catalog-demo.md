# Products RS-Style Catalog Demo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an RS Delivers-style B2B catalog at `/catalog` (index + detail pages + quote basket) using Elysee's 8 existing products plus a data model ready for Excel import, without touching the existing cinematic site.

**Architecture:** Static Astro pages with client-side hydration of three tiny vanilla TS modules (filter engine, search, basket store). The catalog is its own namespace under `src/pages/catalog/`, `src/components/catalog/`, `src/scripts/catalog/`, `src/styles/catalog.css` — the cinematic homepage and `/products` routes stay untouched. Data lives in the existing MDX content collection with **additive** schema fields. Filter rail facets are derived at build time from the product set so they auto-rebuild when more products are imported. Quote basket persists to localStorage.

**Tech Stack:** Astro 5 · MDX · Tailwind v4 · TypeScript · Vitest · `xlsx` (devDep, for the import script)

**Spec:** `docs/superpowers/specs/2026-04-27-products-rs-catalog-demo-design.md`

---

## File map

### Created

```
src/styles/catalog.css                       # catalog-only token layer + base utility classes
src/content/types.ts                         # shared types derived from collection schema (Product, Sector, etc.)

src/scripts/catalog/types.ts                 # client-side types: Filters, BasketItem, etc.
src/scripts/catalog/filter-engine.ts         # apply filters + sort + URL sync
src/scripts/catalog/mini-search.ts           # tiny string-includes search
src/scripts/catalog/derive-facets.ts         # build-time facet derivation from product list
src/scripts/catalog/basket-store.ts          # subscribe/publish, localStorage-backed
src/scripts/catalog/format.ts                # tiny formatters (DN, PN, code etc.)
src/scripts/catalog/url-state.ts             # URLSearchParams encode/decode for filter state
src/scripts/catalog/page-init.ts             # one entrypoint that wires the index page DOM to the engine

src/components/catalog/CatalogHero.astro
src/components/catalog/UtilityBar.astro
src/components/catalog/FilterRail.astro                 # also renders mobile drawer toggle + active-filter chips inline
src/components/catalog/FilterGroup.astro
src/components/catalog/RangeFilter.astro
src/components/catalog/ProductGrid.astro
src/components/catalog/ProductCard.astro
src/components/catalog/ProductRow.astro
src/components/catalog/EmptyResults.astro
src/components/catalog/DetailHero.astro
src/components/catalog/KeySpecs.astro
src/components/catalog/SpecTable.astro
src/components/catalog/TabBar.astro
src/components/catalog/RelatedProducts.astro
src/components/catalog/QuoteBasket.astro                # pill + drawer + form (form inlined)
# Pagination deferred — YAGNI for 8 products; revisit when Excel imports >24 rows.

src/pages/catalog/index.astro
src/pages/catalog/[slug].astro

scripts/catalog/import-excel.ts              # Node CLI: xlsx → MDX writer

tests/catalogFilterEngine.test.ts
tests/catalogMiniSearch.test.ts
tests/catalogBasketStore.test.ts
tests/catalogDeriveFacets.test.ts
tests/catalogUrlState.test.ts
tests/catalogFormat.test.ts
tests/catalogIntegration.test.ts             # smoke test of /catalog rendered HTML
```

### Modified (additive only — see spec §2.3 coexistence rule)

```
src/content/config.ts                        # add new optional fields to products schema
src/content/products/*.mdx                   # add code, sectors[], material, dnRange, pnRating, standards[], imageUrls[], installation
src/components/ui/Nav.astro                  # add one nav link "Catalog (preview)"
package.json                                 # add xlsx as devDependency
README.md                                    # append one-line note about /catalog
```

### Untouched (verify no regression after every task)

```
src/pages/index.astro
src/pages/products/index.astro
src/pages/products/epsilon.astro
src/pages/404.astro
src/components/sections/**
src/components/products/**
src/components/hero/**
src/scripts/motion/**
src/styles/tokens.css
src/styles/global.css (if any)
```

---

## Phase 1 — Foundation

### Task 1: Extend product schema (additive)

**Files:**
- Modify: `src/content/config.ts`
- Test: none (Astro validates at build time)

- [ ] **Step 1: Edit schema**

Replace the `products` collection block in `src/content/config.ts` with:

```ts
const products = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    category: z.enum(['compression-fittings', 'pvc-ball-valves', 'saddles', 'adaptor-flanged', 'couplings', 'valves']),
    blurb: z.string(),
    pressure: z.string(),
    sizeRange: z.string(),
    featured: z.boolean().default(false),
    image: z.string(),
    specs: z.array(z.object({ key: z.string(), value: z.string() })).default([]),
    bim: z.boolean().default(false),
    datasheet: z.string().optional(),

    // Catalog fields (additive)
    code: z.string().optional(),
    sectors: z.array(z.enum(['agriculture', 'landscape', 'building', 'industry'])).default([]),
    material: z.string().optional(),
    dnRange: z.tuple([z.number(), z.number()]).optional(),
    pnRating: z.number().optional(),
    standards: z.array(z.string()).default([]),
    imageUrls: z.array(z.string()).default([]),
    installation: z.string().optional()
  })
});
```

- [ ] **Step 2: Run build to verify the existing 8 MDX files still validate**

Run: `npm run check`
Expected: PASS — schema is purely additive with safe defaults.

- [ ] **Step 3: Commit**

```bash
git add src/content/config.ts
git commit -m "feat(catalog): extend product schema with catalog fields"
```

---

### Task 2: Migrate the 8 product MDX files with catalog data

**Files:**
- Modify: `src/content/products/epsilon.mdx`
- Modify: `src/content/products/adaptor-flanged.mdx`
- Modify: `src/content/products/coupling-repair.mdx`
- Modify: `src/content/products/coupling-transition.mdx`
- Modify: `src/content/products/single-4-bolts.mdx`
- Modify: `src/content/products/double-union-glued.mdx`
- Modify: `src/content/products/pvc-ball-valve.mdx`
- Modify: `src/content/products/saddle-clamp.mdx`

- [ ] **Step 1: Update `epsilon.mdx` frontmatter**

Add these fields to the existing frontmatter (keep all existing fields intact, add `# code synthesized — Elysee publishes Series-level not single-SKU` comment):

```yaml
code: EPS-PE-001
sectors: [agriculture, landscape]
material: POM body / EPDM seal
dnRange: [20, 110]
pnRating: 16
standards: [ISO 17885, WRAS, KIWA]
imageUrls:
  - /images/products/epsilon-hero.svg
installation: |
  Cut PE pipe square. Insert through the nut, then the collet, then the o-ring. Push fully into the body until the pipe meets the internal stop. Tighten the nut hand-tight, then a quarter turn with a wrench.
```

- [ ] **Step 2: Update `adaptor-flanged.mdx`**

Add to frontmatter:

```yaml
code: NO330D
sectors: [building, industry]
material: PVC-U flange / EPDM gasket
dnRange: [50, 160]
pnRating: 16
standards: [EN 1452, DIN 8061]
imageUrls:
  - https://elysee.com.cy/portal-img/default/246/no330d-a-adaptor-flanged-set-1.jpg
installation: |
  Align bolt holes, place gasket between mating flanges, hand-tighten bolts in a star pattern, then torque progressively to manufacturer spec.
```

- [ ] **Step 3: Update `coupling-repair.mdx`**

Add to frontmatter:

```yaml
code: NO331B
sectors: [agriculture, building]
material: PP body / EPDM seal
dnRange: [20, 110]
pnRating: 16
standards: [ISO 14236]
imageUrls:
  - https://elysee.com.cy/portal-img/default/246/no331b-a-coupling-repair-1.jpg
installation: |
  Slide coupling over both pipe ends until centered on the break. Tighten both compression nuts evenly.
```

- [ ] **Step 4: Update `coupling-transition.mdx`**

Add to frontmatter:

```yaml
code: NO321D
sectors: [agriculture, landscape, building]
material: PP body / brass insert / EPDM seal
dnRange: [20, 63]
pnRating: 16
standards: [ISO 14236]
imageUrls:
  - https://elysee.com.cy/portal-img/default/246/no321d-a-coupling-global-transition-1.jpg
installation: |
  Compression end onto PE pipe; threaded end to a male pipe thread sealed with PTFE tape.
```

- [ ] **Step 5: Update `single-4-bolts.mdx`**

Add to frontmatter:

```yaml
code: NO550V
sectors: [building, industry]
material: Ductile iron flange / EPDM gasket / steel bolts
dnRange: [110, 315]
pnRating: 10
standards: [EN 1092-1]
imageUrls:
  - https://elysee.com.cy/portal-img/default/246/no550v-c-single-4-bolts-1.jpg
installation: |
  Align bolt holes between mating flanges. Place the gasket. Hand-tighten the four bolts in a star pattern, then torque progressively to the manufacturer's spec.
```

- [ ] **Step 6: Update `double-union-glued.mdx`**

Add to frontmatter:

```yaml
code: NO108F
sectors: [building, industry]
material: PVC-U body / EPDM o-rings
dnRange: [20, 63]
pnRating: 16
standards: [EN 1452]
imageUrls:
  - https://elysee.com.cy/portal-img/default/246/no108f-e-double-union-glued-1.jpg
installation: |
  Solvent-weld both spigots. Allow 24h cure under no-pressure conditions before commissioning.
```

- [ ] **Step 7: Update `pvc-ball-valve.mdx`**

Add to frontmatter (`# code synthesized` comment in MDX above the field):

```yaml
code: PVC-BV-50
sectors: [building, landscape]
material: PVC-U body / PTFE seat / EPDM o-ring
dnRange: [20, 110]
pnRating: 16
standards: [EN 1452, DIN 8061]
imageUrls:
  - /images/products/pvc-ball-valve.svg
installation: |
  Solvent-weld both spigots. Test handle rotation before installation. Avoid using as a flow-control device for prolonged partial openings.
```

- [ ] **Step 8: Update `saddle-clamp.mdx`**

Add to frontmatter (`# code synthesized` comment above):

```yaml
code: SDL-CL-32
sectors: [agriculture, landscape, industry]
material: PP saddle / EPDM gasket / stainless bolts
dnRange: [63, 315]
pnRating: 16
standards: [ISO 8085]
imageUrls:
  - /images/products/saddle-clamp.svg
installation: |
  Drill the main pipe to the saddle's outlet bore. Center the saddle and fit the gasket. Tighten bolts evenly in a cross pattern to the manufacturer's specified torque.
```

- [ ] **Step 9: Build to verify all 8 validate**

Run: `npm run check`
Expected: PASS, no schema errors.

- [ ] **Step 10: Commit**

```bash
git add src/content/products/
git commit -m "feat(catalog): populate catalog fields on 8 existing products"
```

---

### Task 3: Add catalog stylesheet with token layer

**Files:**
- Create: `src/styles/catalog.css`

- [ ] **Step 1: Create the file**

```css
/* Catalog-only tokens. Imported only by /catalog routes. */
.catalog-scope {
  --cat-surface: #f6f1e6;
  --cat-surface-raised: #ffffff;
  --cat-surface-sunken: #ece5d4;
  --cat-ink: #0a1410;
  --cat-ink-muted: #52635a;
  --cat-ink-subtle: #8a958e;
  --cat-accent: #3d6b52;
  --cat-accent-bright: #7eb08c;
  --cat-hairline: rgba(10, 20, 16, 0.10);
  --cat-hairline-strong: rgba(10, 20, 16, 0.18);

  background: var(--cat-surface);
  color: var(--cat-ink);
  font-family: 'Inter Tight', system-ui, sans-serif;
}

.catalog-scope .cat-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; letter-spacing: 0.04em; }
.catalog-scope .cat-display { font-family: 'Fraunces', Georgia, serif; }

.catalog-scope .cat-card {
  background: var(--cat-surface-raised);
  border: 1px solid var(--cat-hairline);
  border-radius: 4px;
  transition: box-shadow 150ms ease, border-color 150ms ease;
}
.catalog-scope .cat-card:hover {
  box-shadow: 0 4px 16px rgba(10, 20, 16, 0.06);
  border-color: var(--cat-hairline-strong);
}

.catalog-scope .cat-btn {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.625rem 1rem;
  font-size: 13px; font-weight: 600;
  border-radius: 3px;
  transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
  cursor: pointer;
}
.catalog-scope .cat-btn--primary { background: var(--cat-accent); color: var(--cat-surface-raised); border: 1px solid var(--cat-accent); }
.catalog-scope .cat-btn--primary:hover { background: var(--cat-accent-bright); border-color: var(--cat-accent-bright); }
.catalog-scope .cat-btn--ghost { background: transparent; color: var(--cat-accent); border: 1px solid var(--cat-hairline-strong); }
.catalog-scope .cat-btn--ghost:hover { background: var(--cat-surface-sunken); }
.catalog-scope .cat-btn[disabled] { opacity: 0.4; cursor: not-allowed; }

.catalog-scope .cat-chip {
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px; letter-spacing: 0.04em;
  background: var(--cat-surface-sunken);
  border: 1px solid var(--cat-hairline);
  border-radius: 999px;
}

.catalog-scope .cat-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.catalog-scope .cat-table tr { border-bottom: 1px solid var(--cat-hairline); }
.catalog-scope .cat-table tr:nth-child(even) { background: var(--cat-surface-sunken); }
.catalog-scope .cat-table th, .catalog-scope .cat-table td { padding: 0.625rem 0.875rem; text-align: left; vertical-align: top; }
.catalog-scope .cat-table th { font-weight: 600; color: var(--cat-ink-muted); width: 40%; }
.catalog-scope .cat-table td { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px; }

@media (prefers-reduced-motion: reduce) {
  .catalog-scope * { transition-duration: 0ms !important; }
}
```

- [ ] **Step 2: Verify the existing site doesn't import this file anywhere**

Run: `grep -r "catalog.css" src/ tests/ || echo "not imported, expected"`
Expected: `not imported, expected`

- [ ] **Step 3: Commit**

```bash
git add src/styles/catalog.css
git commit -m "feat(catalog): add scoped stylesheet with cream tokens"
```

---

### Task 4: Add `xlsx` devDependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install**

Run: `npm install --save-dev xlsx`
Expected: package added to `devDependencies`, `package-lock.json` updated.

- [ ] **Step 2: Verify**

Run: `node -e "console.log(require('xlsx').version)"`
Expected: prints a version string (e.g. `0.18.5`).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add xlsx devDependency for catalog import script"
```

---

## Phase 2 — Core logic (TDD)

### Task 5: Catalog types module

**Files:**
- Create: `src/scripts/catalog/types.ts`

- [ ] **Step 1: Define types**

```ts
export type Sector = 'agriculture' | 'landscape' | 'building' | 'industry';
export type Category = 'compression-fittings' | 'pvc-ball-valves' | 'saddles' | 'adaptor-flanged' | 'couplings' | 'valves';

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
```

- [ ] **Step 2: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/scripts/catalog/types.ts
git commit -m "feat(catalog): add shared types for catalog runtime"
```

---

### Task 6: URL state encode/decode (TDD)

**Files:**
- Create: `tests/catalogUrlState.test.ts`
- Create: `src/scripts/catalog/url-state.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/catalogUrlState.test.ts
import { describe, it, expect } from 'vitest';
import { encodeFilters, decodeFilters } from '~/scripts/catalog/url-state';
import { EMPTY_FILTERS, type Filters } from '~/scripts/catalog/types';

describe('url-state', () => {
  it('round-trips empty filters to empty string', () => {
    expect(encodeFilters(EMPTY_FILTERS)).toBe('');
  });

  it('round-trips sectors and categories', () => {
    const f: Filters = { ...EMPTY_FILTERS, sectors: ['agriculture', 'industry'], categories: ['valves'] };
    const encoded = encodeFilters(f);
    expect(encoded).toContain('sectors=agriculture%2Cindustry');
    expect(encoded).toContain('categories=valves');
    expect(decodeFilters(encoded)).toEqual(f);
  });

  it('round-trips numeric ranges', () => {
    const f: Filters = { ...EMPTY_FILTERS, dn: [20, 110], pn: [10, 16] };
    const encoded = encodeFilters(f);
    expect(decodeFilters(encoded)).toEqual(f);
  });

  it('round-trips boolean flags', () => {
    const f: Filters = { ...EMPTY_FILTERS, hasDatasheet: true, bimAvailable: true };
    expect(decodeFilters(encodeFilters(f))).toEqual(f);
  });

  it('round-trips search term with encoded special characters', () => {
    const f: Filters = { ...EMPTY_FILTERS, search: 'NO330D & friends' };
    expect(decodeFilters(encodeFilters(f)).search).toBe('NO330D & friends');
  });

  it('decodes unknown sectors as empty (defensive)', () => {
    const result = decodeFilters('sectors=banana,industry');
    expect(result.sectors).toEqual(['industry']);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm run test -- catalogUrlState`
Expected: FAIL (`Cannot find module '~/scripts/catalog/url-state'`).

- [ ] **Step 3: Implement**

```ts
// src/scripts/catalog/url-state.ts
import { EMPTY_FILTERS, type Filters, type Sector, type Category } from './types';

const SECTORS: Sector[] = ['agriculture', 'landscape', 'building', 'industry'];
const CATEGORIES: Category[] = ['compression-fittings', 'pvc-ball-valves', 'saddles', 'adaptor-flanged', 'couplings', 'valves'];

export function encodeFilters(f: Filters): string {
  const params = new URLSearchParams();
  if (f.search) params.set('q', f.search);
  if (f.sectors.length) params.set('sectors', f.sectors.join(','));
  if (f.categories.length) params.set('categories', f.categories.join(','));
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
    categories: parseList(params.get('categories'), CATEGORIES),
    materials: params.get('materials')?.split(',').filter(Boolean) ?? [],
    standards: params.get('standards')?.split(',').filter(Boolean) ?? [],
    dn: parseRange(params.get('dn')),
    pn: parseRange(params.get('pn')),
    hasDatasheet: params.get('ds') === '1',
    bimAvailable: params.get('bim') === '1'
  };
}
```

- [ ] **Step 4: Run to confirm pass**

Run: `npm run test -- catalogUrlState`
Expected: 6/6 pass.

- [ ] **Step 5: Commit**

```bash
git add tests/catalogUrlState.test.ts src/scripts/catalog/url-state.ts
git commit -m "feat(catalog): URL-state encode/decode for filters"
```

---

### Task 7: Mini-search (TDD)

**Files:**
- Create: `tests/catalogMiniSearch.test.ts`
- Create: `src/scripts/catalog/mini-search.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/catalogMiniSearch.test.ts
import { describe, it, expect } from 'vitest';
import { search } from '~/scripts/catalog/mini-search';
import type { CatalogProduct } from '~/scripts/catalog/types';

const product = (overrides: Partial<CatalogProduct>): CatalogProduct => ({
  slug: 'x', name: 'X', category: 'valves', sectors: [], standards: [], imageUrls: [],
  image: '', blurb: '', pressure: '', sizeRange: '', bim: false, specs: [], featured: false,
  ...overrides
});

const products: CatalogProduct[] = [
  product({ slug: 'a', name: 'Adaptor Flanged Set', code: 'NO330D', blurb: 'Flanged adaptor for PVC' }),
  product({ slug: 'b', name: 'Ball Valve', code: 'PVC-BV-50', specs: [{ key: 'Material', value: 'PVC-U body' }] }),
  product({ slug: 'c', name: 'Coupling Repair', code: 'NO331B' })
];

describe('mini-search', () => {
  it('returns all products for empty query', () => {
    expect(search(products, '').map(p => p.slug)).toEqual(['a', 'b', 'c']);
  });
  it('finds by exact code', () => {
    expect(search(products, 'NO330D').map(p => p.slug)).toEqual(['a']);
  });
  it('finds by code prefix', () => {
    expect(search(products, 'NO33').map(p => p.slug).sort()).toEqual(['a', 'c']);
  });
  it('finds by name (case-insensitive)', () => {
    expect(search(products, 'BALL').map(p => p.slug)).toEqual(['b']);
  });
  it('finds by spec value', () => {
    expect(search(products, 'PVC-U').map(p => p.slug)).toEqual(['b']);
  });
  it('finds by blurb', () => {
    expect(search(products, 'Flanged adaptor').map(p => p.slug)).toEqual(['a']);
  });
  it('returns empty for no match', () => {
    expect(search(products, 'zzz')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm run test -- catalogMiniSearch`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/scripts/catalog/mini-search.ts
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
```

- [ ] **Step 4: Run to confirm pass**

Run: `npm run test -- catalogMiniSearch`
Expected: 7/7 pass.

- [ ] **Step 5: Commit**

```bash
git add tests/catalogMiniSearch.test.ts src/scripts/catalog/mini-search.ts
git commit -m "feat(catalog): client-side string-includes search"
```

---

### Task 8: Filter engine (TDD)

**Files:**
- Create: `tests/catalogFilterEngine.test.ts`
- Create: `src/scripts/catalog/filter-engine.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/catalogFilterEngine.test.ts
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
    // Product DN ranges overlap with filter range [40, 60] → a (20-50) and b (50-110)
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
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm run test -- catalogFilterEngine`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/scripts/catalog/filter-engine.ts
import type { CatalogProduct, Filters, SortKey } from './types';
import { search } from './mini-search';

function rangesOverlap(a: [number, number], b: [number, number]): boolean {
  return a[0] <= b[1] && b[0] <= a[1];
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
```

- [ ] **Step 4: Run to confirm pass**

Run: `npm run test -- catalogFilterEngine`
Expected: 14/14 pass.

- [ ] **Step 5: Commit**

```bash
git add tests/catalogFilterEngine.test.ts src/scripts/catalog/filter-engine.ts
git commit -m "feat(catalog): filter engine with AND-across-facets / OR-within-facet"
```

---

### Task 9: Facet derivation (TDD)

**Files:**
- Create: `tests/catalogDeriveFacets.test.ts`
- Create: `src/scripts/catalog/derive-facets.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/catalogDeriveFacets.test.ts
import { describe, it, expect } from 'vitest';
import { deriveFacets } from '~/scripts/catalog/derive-facets';
import type { CatalogProduct } from '~/scripts/catalog/types';

const product = (overrides: Partial<CatalogProduct>): CatalogProduct => ({
  slug: 'x', name: 'X', category: 'valves', sectors: [], standards: [], imageUrls: [],
  image: '', blurb: '', pressure: '', sizeRange: '', bim: false, specs: [], featured: false,
  ...overrides
});

describe('deriveFacets', () => {
  it('counts sectors across products', () => {
    const ps = [
      product({ sectors: ['agriculture', 'landscape'] }),
      product({ sectors: ['agriculture'] }),
      product({ sectors: ['industry'] })
    ];
    const f = deriveFacets(ps);
    expect(f.sectors).toEqual([
      { value: 'agriculture', count: 2 },
      { value: 'landscape', count: 1 },
      { value: 'industry', count: 1 }
    ]);
  });

  it('uniques materials and sorts alphabetically', () => {
    const ps = [
      product({ material: 'PVC-U' }),
      product({ material: 'POM' }),
      product({ material: 'PVC-U' })
    ];
    expect(deriveFacets(ps).materials).toEqual([
      { value: 'POM', count: 1 },
      { value: 'PVC-U', count: 2 }
    ]);
  });

  it('uniques standards', () => {
    const ps = [
      product({ standards: ['EN 1452', 'ISO 17885'] }),
      product({ standards: ['EN 1452'] })
    ];
    expect(deriveFacets(ps).standards).toEqual([
      { value: 'EN 1452', count: 2 },
      { value: 'ISO 17885', count: 1 }
    ]);
  });

  it('computes DN min/max', () => {
    const ps = [
      product({ dnRange: [20, 110] }),
      product({ dnRange: [16, 50] }),
      product({})
    ];
    expect(deriveFacets(ps).dn).toEqual({ min: 16, max: 110 });
  });

  it('returns null DN when no product has dnRange', () => {
    expect(deriveFacets([product({})]).dn).toBeNull();
  });

  it('computes PN min/max', () => {
    const ps = [product({ pnRating: 10 }), product({ pnRating: 16 }), product({})];
    expect(deriveFacets(ps).pn).toEqual({ min: 10, max: 16 });
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm run test -- catalogDeriveFacets`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/scripts/catalog/derive-facets.ts
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

function tally<T extends string>(items: T[][]): FacetCount<T>[] {
  const map = new Map<T, number>();
  for (const arr of items) for (const v of arr) map.set(v, (map.get(v) ?? 0) + 1);
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .map(([value, count]) => ({ value, count }));
}

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
```

- [ ] **Step 4: Run to confirm pass**

Run: `npm run test -- catalogDeriveFacets`
Expected: 6/6 pass.

- [ ] **Step 5: Commit**

```bash
git add tests/catalogDeriveFacets.test.ts src/scripts/catalog/derive-facets.ts
git commit -m "feat(catalog): build-time facet derivation from product list"
```

---

### Task 10: Basket store (TDD)

**Files:**
- Create: `tests/catalogBasketStore.test.ts`
- Create: `src/scripts/catalog/basket-store.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/catalogBasketStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createBasketStore } from '~/scripts/catalog/basket-store';
import type { BasketItem } from '~/scripts/catalog/types';

const sample: BasketItem = { slug: 'epsilon', code: 'EPS-PE-001', name: 'Epsilon Series', thumb: '/epsilon.svg', qty: 1 };

describe('basket-store', () => {
  beforeEach(() => { localStorage.clear(); });

  it('starts empty', () => {
    const s = createBasketStore();
    expect(s.getItems()).toEqual([]);
    expect(s.getCount()).toBe(0);
  });

  it('adds items', () => {
    const s = createBasketStore();
    s.add(sample);
    expect(s.getItems()).toEqual([sample]);
    expect(s.getCount()).toBe(1);
  });

  it('increments qty when adding the same slug', () => {
    const s = createBasketStore();
    s.add(sample);
    s.add(sample);
    expect(s.getItems()[0].qty).toBe(2);
    expect(s.getCount()).toBe(2);
  });

  it('updates qty', () => {
    const s = createBasketStore();
    s.add(sample);
    s.setQty('epsilon', 5);
    expect(s.getItems()[0].qty).toBe(5);
  });

  it('removes when setQty 0', () => {
    const s = createBasketStore();
    s.add(sample);
    s.setQty('epsilon', 0);
    expect(s.getItems()).toEqual([]);
  });

  it('clears all', () => {
    const s = createBasketStore();
    s.add(sample);
    s.clear();
    expect(s.getItems()).toEqual([]);
  });

  it('persists to localStorage and restores', () => {
    const s1 = createBasketStore();
    s1.add(sample);
    const s2 = createBasketStore();
    expect(s2.getItems()).toEqual([sample]);
  });

  it('caps at 50 items', () => {
    const s = createBasketStore();
    for (let i = 0; i < 60; i++) {
      s.add({ ...sample, slug: `p-${i}`, name: `P${i}` });
    }
    expect(s.getItems().length).toBe(50);
  });

  it('reports isFull at cap', () => {
    const s = createBasketStore();
    for (let i = 0; i < 50; i++) s.add({ ...sample, slug: `p-${i}` });
    expect(s.isFull()).toBe(true);
  });

  it('notifies subscribers on change', () => {
    const s = createBasketStore();
    const fn = vi.fn();
    s.subscribe(fn);
    s.add(sample);
    expect(fn).toHaveBeenCalledWith([sample]);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm run test -- catalogBasketStore`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/scripts/catalog/basket-store.ts
import type { BasketItem } from './types';

const KEY = 'elysee.catalog.quote.v1';
const CAP = 50;

export interface BasketStore {
  getItems(): BasketItem[];
  getCount(): number;
  isFull(): boolean;
  add(item: BasketItem): void;
  setQty(slug: string, qty: number): void;
  remove(slug: string): void;
  clear(): void;
  subscribe(fn: (items: BasketItem[]) => void): () => void;
}

function load(): BasketItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function save(items: BasketItem[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* quota */ }
}

export function createBasketStore(): BasketStore {
  let items = load();
  const subs = new Set<(items: BasketItem[]) => void>();

  const notify = () => { save(items); subs.forEach(fn => fn(items)); };

  return {
    getItems: () => items.slice(),
    getCount: () => items.reduce((n, it) => n + it.qty, 0),
    isFull: () => items.length >= CAP,
    add: (item) => {
      const existing = items.find(i => i.slug === item.slug);
      if (existing) { existing.qty += item.qty; }
      else if (items.length < CAP) { items = [...items, item]; }
      notify();
    },
    setQty: (slug, qty) => {
      if (qty <= 0) items = items.filter(i => i.slug !== slug);
      else items = items.map(i => i.slug === slug ? { ...i, qty } : i);
      notify();
    },
    remove: (slug) => { items = items.filter(i => i.slug !== slug); notify(); },
    clear: () => { items = []; notify(); },
    subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn); }
  };
}

let _instance: BasketStore | null = null;
export function getBasket(): BasketStore {
  if (!_instance) _instance = createBasketStore();
  return _instance;
}
```

- [ ] **Step 4: Run to confirm pass**

Run: `npm run test -- catalogBasketStore`
Expected: 10/10 pass.

- [ ] **Step 5: Commit**

```bash
git add tests/catalogBasketStore.test.ts src/scripts/catalog/basket-store.ts
git commit -m "feat(catalog): basket store with localStorage + subscribe"
```

---

### Task 11: Format helpers

**Files:**
- Create: `tests/catalogFormat.test.ts`
- Create: `src/scripts/catalog/format.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/catalogFormat.test.ts
import { describe, it, expect } from 'vitest';
import { formatDN, formatPN, formatSectorList } from '~/scripts/catalog/format';

describe('format', () => {
  it('formatDN renders range', () => {
    expect(formatDN([20, 110])).toBe('DN 20–110');
  });
  it('formatDN renders single when min === max', () => {
    expect(formatDN([50, 50])).toBe('DN 50');
  });
  it('formatPN renders bar suffix', () => {
    expect(formatPN(16)).toBe('PN 16');
  });
  it('formatSectorList capitalizes and joins', () => {
    expect(formatSectorList(['agriculture', 'building'])).toBe('Agriculture · Building');
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm run test -- catalogFormat`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/scripts/catalog/format.ts
import type { Sector } from './types';

export function formatDN(r: [number, number]): string {
  return r[0] === r[1] ? `DN ${r[0]}` : `DN ${r[0]}–${r[1]}`;
}
export function formatPN(n: number): string { return `PN ${n}`; }
export function formatSectorList(s: Sector[]): string {
  return s.map(x => x[0].toUpperCase() + x.slice(1)).join(' · ');
}
```

- [ ] **Step 4: Run to confirm pass**

Run: `npm run test -- catalogFormat`
Expected: 4/4 pass.

- [ ] **Step 5: Commit**

```bash
git add tests/catalogFormat.test.ts src/scripts/catalog/format.ts
git commit -m "feat(catalog): tiny formatters for DN, PN, sectors"
```

---

## Phase 3 — Catalog index page

### Task 12: Page scaffold + Base layout

**Files:**
- Create: `src/pages/catalog/index.astro`

- [ ] **Step 1: Write the page (scaffold only — components plug in next tasks)**

```astro
---
import Base from '~/layouts/Base.astro';
import { getCollection } from 'astro:content';
import { deriveFacets } from '~/scripts/catalog/derive-facets';
import type { CatalogProduct } from '~/scripts/catalog/types';
import '~/styles/catalog.css';

const collection = await getCollection('products');
const products: CatalogProduct[] = collection.map(c => ({
  slug: c.slug,
  name: c.data.name,
  code: c.data.code,
  category: c.data.category,
  sectors: c.data.sectors,
  material: c.data.material,
  dnRange: c.data.dnRange,
  pnRating: c.data.pnRating,
  standards: c.data.standards,
  imageUrls: c.data.imageUrls,
  image: c.data.image,
  blurb: c.data.blurb,
  pressure: c.data.pressure,
  sizeRange: c.data.sizeRange,
  bim: c.data.bim,
  datasheet: c.data.datasheet,
  installation: c.data.installation,
  specs: c.data.specs,
  featured: c.data.featured
}));

const facets = deriveFacets(products);
const productsJson = JSON.stringify(products);
const facetsJson = JSON.stringify(facets);
---
<Base title="Catalog (preview) — Elysee Irrigation" description="B2B catalog preview. Filter by sector, category, size, pressure, standard.">
  <div class="catalog-scope" data-catalog-root>
    <main class="page-x py-12">
      <h1 class="cat-display text-4xl">Catalog</h1>
      <p class="cat-mono text-xs text-[var(--cat-ink-subtle)] mt-2">{products.length} products</p>

      <!-- Phase 3 components plug in here -->

      <pre data-products-json style="display:none">{productsJson}</pre>
      <pre data-facets-json style="display:none">{facetsJson}</pre>
    </main>
  </div>
</Base>
```

- [ ] **Step 2: Build to verify the page renders**

Run: `npm run build`
Expected: build succeeds, `dist/catalog/index.html` exists.

- [ ] **Step 3: Visual smoke**

Run: `npm run dev` (in another terminal) and open http://localhost:4321/catalog
Expected: cream background, "Catalog" title in serif, "8 products" in mono, no console errors.
Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add src/pages/catalog/index.astro
git commit -m "feat(catalog): page scaffold with product+facet data inlined"
```

---

### Task 13: CatalogHero component

**Files:**
- Create: `src/components/catalog/CatalogHero.astro`
- Modify: `src/pages/catalog/index.astro`

- [ ] **Step 1: Create CatalogHero**

```astro
---
interface Props { count: number; }
const { count } = Astro.props;
---
<header class="border-b border-[var(--cat-hairline)] py-10">
  <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
    <div>
      <p class="cat-mono text-[11px] text-[var(--cat-ink-subtle)]">Products / Catalog (preview)</p>
      <h1 class="cat-display text-4xl md:text-5xl mt-2">Catalog</h1>
      <p class="cat-mono text-xs text-[var(--cat-ink-muted)] mt-2">{count} products · 4 sectors · 65 countries</p>
    </div>
    <label class="flex items-center gap-2 bg-[var(--cat-surface-raised)] border border-[var(--cat-hairline-strong)] rounded-md px-3 py-2 w-full md:w-[350px]">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>
      <input data-catalog-search type="search" placeholder="Search by code, name, or spec…" class="cat-mono text-xs w-full bg-transparent outline-none" />
    </label>
  </div>
</header>
```

- [ ] **Step 2: Wire it in `index.astro`**

Replace the block from `<h1>` through the count `<p>` with:

```astro
import CatalogHero from '~/components/catalog/CatalogHero.astro';
```

(add at top of frontmatter)

And replace the body's title block with:

```astro
<CatalogHero count={products.length} />
```

- [ ] **Step 3: Visual smoke**

Run: `npm run dev` → http://localhost:4321/catalog
Expected: hero with eyebrow, title, count, and a search input on the right.

- [ ] **Step 4: Commit**

```bash
git add src/components/catalog/CatalogHero.astro src/pages/catalog/index.astro
git commit -m "feat(catalog): hero header with search input"
```

---

### Task 14: UtilityBar component (sticky)

**Files:**
- Create: `src/components/catalog/UtilityBar.astro`
- Modify: `src/pages/catalog/index.astro`

- [ ] **Step 1: Create UtilityBar**

```astro
---
interface Props { count: number; }
const { count } = Astro.props;
---
<div class="sticky top-0 z-20 bg-[var(--cat-surface)] border-b border-[var(--cat-hairline)]">
  <div class="flex items-center justify-between gap-4 py-3">
    <nav aria-label="Breadcrumb" class="cat-mono text-[11px] text-[var(--cat-ink-subtle)]">
      <a href="/" class="hover:text-[var(--cat-accent)]">Home</a>
      <span class="mx-2">/</span>
      <span aria-current="page">Catalog</span>
    </nav>
    <p class="cat-mono text-[11px] text-[var(--cat-ink-muted)]" data-catalog-count>
      Showing {count} of {count} products
    </p>
    <div class="flex items-center gap-3">
      <label class="cat-mono text-[11px] text-[var(--cat-ink-muted)] flex items-center gap-2">
        Sort
        <select data-catalog-sort class="cat-mono text-[11px] bg-[var(--cat-surface-raised)] border border-[var(--cat-hairline-strong)] rounded-sm px-2 py-1">
          <option value="relevance">Most relevant</option>
          <option value="name-asc">Name A–Z</option>
          <option value="pressure-desc">Pressure (high to low)</option>
          <option value="newest">Newest</option>
        </select>
      </label>
      <div class="flex items-center border border-[var(--cat-hairline-strong)] rounded-sm overflow-hidden" role="group" aria-label="View mode">
        <button data-catalog-view="grid" class="cat-mono text-[11px] px-2 py-1 bg-[var(--cat-accent)] text-[var(--cat-surface-raised)]" aria-pressed="true">Grid</button>
        <button data-catalog-view="list" class="cat-mono text-[11px] px-2 py-1" aria-pressed="false">List</button>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Wire into the page**

Add to `index.astro` frontmatter imports:

```astro
import UtilityBar from '~/components/catalog/UtilityBar.astro';
```

After `<CatalogHero ... />` add:

```astro
<UtilityBar count={products.length} />
```

- [ ] **Step 3: Visual smoke**

Run: `npm run dev` → http://localhost:4321/catalog
Expected: a horizontal bar below the hero, sticks to top on scroll.

- [ ] **Step 4: Commit**

```bash
git add src/components/catalog/UtilityBar.astro src/pages/catalog/index.astro
git commit -m "feat(catalog): sticky utility bar (breadcrumbs, sort, view toggle)"
```

---

### Task 15: ProductCard

**Files:**
- Create: `src/components/catalog/ProductCard.astro`

- [ ] **Step 1: Create the card**

```astro
---
import type { CatalogProduct } from '~/scripts/catalog/types';
import { formatDN, formatPN } from '~/scripts/catalog/format';
interface Props { product: CatalogProduct; }
const { product: p } = Astro.props;
const thumb = p.imageUrls[0] ?? p.image;
---
<article class="cat-card overflow-hidden flex flex-col" data-product-card data-slug={p.slug}>
  <a href={`/catalog/${p.slug}`} class="block aspect-square bg-white">
    <img src={thumb} alt={p.name} loading="lazy" width="320" height="320" class="w-full h-full object-contain p-4" />
  </a>
  <div class="p-4 flex flex-col gap-2 flex-1">
    {p.code && <p class="cat-mono text-[11px] text-[var(--cat-ink-subtle)]">{p.code}</p>}
    <a href={`/catalog/${p.slug}`} class="cat-display text-[22px] leading-tight hover:text-[var(--cat-accent)]">{p.name}</a>
    <p class="text-xs text-[var(--cat-ink-muted)] line-clamp-2">{p.blurb}</p>
    <div class="flex flex-wrap gap-1 mt-2">
      {p.pnRating !== undefined && <span class="cat-chip">{formatPN(p.pnRating)}</span>}
      {p.dnRange && <span class="cat-chip">{formatDN(p.dnRange)}</span>}
      {p.material && <span class="cat-chip">{p.material.split('/')[0].trim()}</span>}
    </div>
    <div class="flex items-center justify-between mt-auto pt-3">
      <button data-add-to-quote data-slug={p.slug} data-name={p.name} data-code={p.code ?? ''} data-thumb={thumb} class="cat-btn cat-btn--ghost">Add to quote</button>
      <a href={`/catalog/${p.slug}`} class="cat-mono text-[11px] text-[var(--cat-accent)] hover:text-[var(--cat-accent-bright)]">View →</a>
    </div>
  </div>
</article>
```

- [ ] **Step 2: Commit (component is wired in next task)**

```bash
git add src/components/catalog/ProductCard.astro
git commit -m "feat(catalog): product card (grid view)"
```

---

### Task 16: ProductRow (list view)

**Files:**
- Create: `src/components/catalog/ProductRow.astro`

- [ ] **Step 1: Create the row**

```astro
---
import type { CatalogProduct } from '~/scripts/catalog/types';
import { formatDN, formatPN } from '~/scripts/catalog/format';
interface Props { product: CatalogProduct; }
const { product: p } = Astro.props;
const thumb = p.imageUrls[0] ?? p.image;
---
<article class="cat-card flex flex-col md:flex-row gap-4 p-4" data-product-row data-slug={p.slug}>
  <a href={`/catalog/${p.slug}`} class="flex-shrink-0 w-full md:w-[120px] aspect-square bg-white">
    <img src={thumb} alt={p.name} loading="lazy" width="120" height="120" class="w-full h-full object-contain p-2" />
  </a>
  <div class="flex-1 flex flex-col gap-1">
    {p.code && <p class="cat-mono text-[11px] text-[var(--cat-ink-subtle)]">{p.code}</p>}
    <a href={`/catalog/${p.slug}`} class="cat-display text-xl hover:text-[var(--cat-accent)]">{p.name}</a>
    <p class="text-xs text-[var(--cat-ink-muted)]">{p.blurb}</p>
    <div class="flex flex-wrap gap-1 mt-1">
      {p.pnRating !== undefined && <span class="cat-chip">{formatPN(p.pnRating)}</span>}
      {p.dnRange && <span class="cat-chip">{formatDN(p.dnRange)}</span>}
      {p.material && <span class="cat-chip">{p.material.split('/')[0].trim()}</span>}
      {p.standards.slice(0, 2).map(s => <span class="cat-chip">{s}</span>)}
    </div>
  </div>
  <div class="flex md:flex-col items-stretch md:items-end gap-2 md:justify-center">
    <button data-add-to-quote data-slug={p.slug} data-name={p.name} data-code={p.code ?? ''} data-thumb={thumb} class="cat-btn cat-btn--primary">Add to quote</button>
    <a href={`/catalog/${p.slug}`} class="cat-btn cat-btn--ghost">View details</a>
  </div>
</article>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/catalog/ProductRow.astro
git commit -m "feat(catalog): product row (list view)"
```

---

### Task 17: ProductGrid (wraps grid+list, view-toggle aware)

**Files:**
- Create: `src/components/catalog/ProductGrid.astro`
- Create: `src/components/catalog/EmptyResults.astro`

- [ ] **Step 1: Create EmptyResults**

```astro
---
---
<div data-catalog-empty class="hidden text-center py-16 col-span-full">
  <p class="cat-display text-2xl">No products match these filters.</p>
  <button type="button" data-clear-filters class="cat-btn cat-btn--ghost mt-4">Clear all filters</button>
</div>
```

- [ ] **Step 2: Create ProductGrid**

```astro
---
import type { CatalogProduct } from '~/scripts/catalog/types';
import ProductCard from './ProductCard.astro';
import ProductRow from './ProductRow.astro';
import EmptyResults from './EmptyResults.astro';
interface Props { products: CatalogProduct[]; }
const { products } = Astro.props;
---
<div data-products-grid class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
  {products.map(p => <ProductCard product={p} />)}
  <EmptyResults />
</div>
<div data-products-list class="hidden flex-col gap-3 mt-8">
  {products.map(p => <ProductRow product={p} />)}
</div>
```

- [ ] **Step 3: Wire ProductGrid into the page**

In `src/pages/catalog/index.astro`, add to imports:

```astro
import ProductGrid from '~/components/catalog/ProductGrid.astro';
import FilterRail from '~/components/catalog/FilterRail.astro';
```

Replace the body section after `<UtilityBar ... />` with the two-column body:

```astro
<div class="grid grid-cols-12 gap-6 py-6">
  <aside class="col-span-12 md:col-span-3 lg:col-span-3">
    <FilterRail facets={facets} count={products.length} />
  </aside>
  <section class="col-span-12 md:col-span-9 lg:col-span-9">
    <ProductGrid products={products} />
  </section>
</div>
```

(FilterRail is implemented in Task 18 — the build will fail until then; that's acceptable since these are sequential.)

- [ ] **Step 4: Commit**

```bash
git add src/components/catalog/ProductGrid.astro src/components/catalog/EmptyResults.astro src/pages/catalog/index.astro
git commit -m "feat(catalog): grid+list view containers and empty state"
```

---

### Task 18: FilterRail + FilterGroup + RangeFilter

**Files:**
- Create: `src/components/catalog/FilterGroup.astro`
- Create: `src/components/catalog/RangeFilter.astro`
- Create: `src/components/catalog/FilterRail.astro`

- [ ] **Step 1: Create FilterGroup**

```astro
---
interface Option { value: string; count: number; }
interface Props { title: string; facetKey: string; options: Option[]; defaultOpen?: boolean; }
const { title, facetKey, options, defaultOpen = false } = Astro.props;
---
<details open={defaultOpen} class="border-b border-[var(--cat-hairline)] py-3">
  <summary class="cat-mono text-[11px] uppercase tracking-wider text-[var(--cat-ink-muted)] cursor-pointer flex items-center justify-between">
    {title}
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" class="transition-transform"><path d="M2 3l3 4 3-4" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
  </summary>
  <fieldset class="mt-2 flex flex-col gap-1.5">
    <legend class="sr-only">{title}</legend>
    {options.map(o => (
      <label class="flex items-center gap-2 text-xs cursor-pointer">
        <input type="checkbox" data-facet={facetKey} value={o.value} class="accent-[var(--cat-accent)]" />
        <span class="flex-1">{o.value.replace(/^./, c => c.toUpperCase())}</span>
        <span class="cat-mono text-[10px] text-[var(--cat-ink-subtle)]">{o.count}</span>
      </label>
    ))}
  </fieldset>
</details>
```

- [ ] **Step 2: Create RangeFilter**

```astro
---
interface Props { title: string; facetKey: string; min: number; max: number; }
const { title, facetKey, min, max } = Astro.props;
---
<details open class="border-b border-[var(--cat-hairline)] py-3">
  <summary class="cat-mono text-[11px] uppercase tracking-wider text-[var(--cat-ink-muted)] cursor-pointer">{title}</summary>
  <div class="mt-3 flex flex-col gap-2">
    <div class="flex justify-between cat-mono text-[11px]">
      <span data-range-label-min={facetKey}>{min}</span>
      <span data-range-label-max={facetKey}>{max}</span>
    </div>
    <input type="range" data-range-min={facetKey} min={min} max={max} value={min} class="w-full accent-[var(--cat-accent)]" aria-label={`${title} minimum`} />
    <input type="range" data-range-max={facetKey} min={min} max={max} value={max} class="w-full accent-[var(--cat-accent)]" aria-label={`${title} maximum`} />
  </div>
</details>
```

- [ ] **Step 3: Create FilterRail**

```astro
---
import type { DerivedFacets } from '~/scripts/catalog/derive-facets';
import FilterGroup from './FilterGroup.astro';
import RangeFilter from './RangeFilter.astro';
interface Props { facets: DerivedFacets; count: number; }
const { facets } = Astro.props;
---
<div class="cat-mono">
  <button type="button" data-clear-filters class="hidden cat-mono text-[11px] text-[var(--cat-accent)] mb-3" data-clear-visibility>Clear all</button>
  <div data-active-filters class="flex flex-wrap gap-1 mb-3"></div>
  <FilterGroup title="Sector" facetKey="sectors" options={facets.sectors} defaultOpen />
  <FilterGroup title="Category" facetKey="categories" options={facets.categories} defaultOpen />
  <FilterGroup title="Material" facetKey="materials" options={facets.materials} defaultOpen />
  {facets.dn && <RangeFilter title="DN size" facetKey="dn" min={facets.dn.min} max={facets.dn.max} />}
  {facets.pn && <RangeFilter title="PN pressure" facetKey="pn" min={facets.pn.min} max={facets.pn.max} />}
  <FilterGroup title="Standards" facetKey="standards" options={facets.standards} />
  <details class="border-b border-[var(--cat-hairline)] py-3">
    <summary class="cat-mono text-[11px] uppercase tracking-wider text-[var(--cat-ink-muted)] cursor-pointer">Other</summary>
    <fieldset class="mt-2 flex flex-col gap-1.5">
      <legend class="sr-only">Other</legend>
      <label class="flex items-center gap-2 text-xs"><input type="checkbox" data-facet="hasDatasheet" class="accent-[var(--cat-accent)]" /><span>Has datasheet</span></label>
      <label class="flex items-center gap-2 text-xs"><input type="checkbox" data-facet="bimAvailable" class="accent-[var(--cat-accent)]" /><span>BIM available</span></label>
    </fieldset>
  </details>
</div>
```

- [ ] **Step 4: Adjust FilterRail to support a mobile drawer wrapper**

Wrap the contents above with a structure that toggles via a body class. Replace the **outermost wrapper** of the FilterRail with the following — i.e. update `<div class="cat-mono">` to be:

```astro
<div data-filter-rail class="cat-mono">
  <div data-filter-rail-inner class="md:block hidden md:static fixed inset-0 z-30 md:z-auto md:bg-transparent bg-[var(--cat-surface)] md:p-0 p-4 overflow-y-auto md:overflow-visible">
    <div class="md:hidden flex items-center justify-between mb-4">
      <span class="cat-display text-lg">Filters</span>
      <button type="button" data-filter-drawer-close class="cat-mono text-xs">✕</button>
    </div>
    <button type="button" data-clear-filters class="hidden cat-mono text-[11px] text-[var(--cat-accent)] mb-3" data-clear-visibility>Clear all</button>
    <div data-active-filters class="flex flex-wrap gap-1 mb-3"></div>
    <FilterGroup title="Sector" facetKey="sectors" options={facets.sectors} defaultOpen />
    <FilterGroup title="Category" facetKey="categories" options={facets.categories} defaultOpen />
    <FilterGroup title="Material" facetKey="materials" options={facets.materials} defaultOpen />
    {facets.dn && <RangeFilter title="DN size" facetKey="dn" min={facets.dn.min} max={facets.dn.max} />}
    {facets.pn && <RangeFilter title="PN pressure" facetKey="pn" min={facets.pn.min} max={facets.pn.max} />}
    <FilterGroup title="Standards" facetKey="standards" options={facets.standards} />
    <details class="border-b border-[var(--cat-hairline)] py-3">
      <summary class="cat-mono text-[11px] uppercase tracking-wider text-[var(--cat-ink-muted)] cursor-pointer">Other</summary>
      <fieldset class="mt-2 flex flex-col gap-1.5">
        <legend class="sr-only">Other</legend>
        <label class="flex items-center gap-2 text-xs"><input type="checkbox" data-facet="hasDatasheet" class="accent-[var(--cat-accent)]" /><span>Has datasheet</span></label>
        <label class="flex items-center gap-2 text-xs"><input type="checkbox" data-facet="bimAvailable" class="accent-[var(--cat-accent)]" /><span>BIM available</span></label>
      </fieldset>
    </details>
    <div class="md:hidden mt-4 sticky bottom-0 bg-[var(--cat-surface)] py-3 border-t border-[var(--cat-hairline)]">
      <button type="button" data-filter-drawer-apply class="cat-btn cat-btn--primary w-full">Show <span data-filter-drawer-count>—</span> results</button>
    </div>
  </div>
  <button type="button" data-filter-drawer-open class="md:hidden cat-btn cat-btn--ghost w-full mb-3">Filters <span data-filter-active-count></span></button>
</div>
```

Note: `[data-filter-rail-inner]` toggles between `hidden` and `block` on mobile via JS (Task 19). On desktop (`md:`) it is always `static block` and the open/close buttons are hidden.

- [ ] **Step 4: Visual smoke**

Run: `npm run dev` → http://localhost:4321/catalog
Expected: filter rail shows on the left, all facet groups present with counts, two range sliders.

- [ ] **Step 5: Commit**

```bash
git add src/components/catalog/FilterGroup.astro src/components/catalog/RangeFilter.astro src/components/catalog/FilterRail.astro
git commit -m "feat(catalog): filter rail (groups, ranges, other facets)"
```

---

### Task 19: Wire client logic into the page (page-init)

**Files:**
- Create: `src/scripts/catalog/page-init.ts`
- Modify: `src/pages/catalog/index.astro`

- [ ] **Step 1: Create page-init**

```ts
// src/scripts/catalog/page-init.ts
import type { CatalogProduct, Filters, SortKey, Sector, Category } from './types';
import { EMPTY_FILTERS } from './types';
import { applyFilters, sortProducts } from './filter-engine';
import { encodeFilters, decodeFilters } from './url-state';
import { getBasket } from './basket-store';

export function initCatalogPage() {
  const root = document.querySelector<HTMLElement>('[data-catalog-root]');
  if (!root) return;

  const productsJson = root.querySelector<HTMLElement>('[data-products-json]')?.textContent ?? '[]';
  const products: CatalogProduct[] = JSON.parse(productsJson);

  const grid = root.querySelector<HTMLElement>('[data-products-grid]');
  const list = root.querySelector<HTMLElement>('[data-products-list]');
  const empty = root.querySelector<HTMLElement>('[data-catalog-empty]');
  const countEl = root.querySelector<HTMLElement>('[data-catalog-count]');
  const searchInput = root.querySelector<HTMLInputElement>('[data-catalog-search]');
  const sortSelect = root.querySelector<HTMLSelectElement>('[data-catalog-sort]');
  const activeChips = root.querySelector<HTMLElement>('[data-active-filters]');
  const clearBtn = root.querySelector<HTMLButtonElement>('[data-clear-filters]');

  let filters: Filters = { ...decodeFilters(window.location.search.slice(1)) };
  let sort: SortKey = (sortSelect?.value as SortKey) ?? 'relevance';

  // Restore checkbox + range UI from URL on load.
  function applyUiFromFilters() {
    root!.querySelectorAll<HTMLInputElement>('input[data-facet]').forEach(el => {
      const k = el.dataset.facet as keyof Filters;
      if (k === 'hasDatasheet' || k === 'bimAvailable') { el.checked = !!filters[k]; return; }
      const arr = (filters as any)[k] as string[] | undefined;
      el.checked = !!arr && arr.includes(el.value);
    });
    if (searchInput) searchInput.value = filters.search;
    ['dn','pn'].forEach(key => {
      const r = (filters as any)[key] as [number, number] | undefined;
      const minEl = root!.querySelector<HTMLInputElement>(`[data-range-min="${key}"]`);
      const maxEl = root!.querySelector<HTMLInputElement>(`[data-range-max="${key}"]`);
      if (r && minEl && maxEl) { minEl.value = String(r[0]); maxEl.value = String(r[1]); }
    });
  }

  function render() {
    const filtered = applyFilters(products, filters);
    const sorted = sortProducts(filtered, sort);
    const slugSet = new Set(sorted.map(p => p.slug));
    grid?.querySelectorAll<HTMLElement>('[data-product-card]').forEach(el => {
      el.style.display = slugSet.has(el.dataset.slug ?? '') ? '' : 'none';
    });
    list?.querySelectorAll<HTMLElement>('[data-product-row]').forEach(el => {
      el.style.display = slugSet.has(el.dataset.slug ?? '') ? '' : 'none';
    });
    if (empty) empty.classList.toggle('hidden', sorted.length !== 0);
    if (countEl) countEl.textContent = `Showing ${sorted.length} of ${products.length} products`;
    renderActiveChips();
    syncUrl();
  }

  function renderActiveChips() {
    if (!activeChips) return;
    const chips: string[] = [];
    filters.sectors.forEach(s => chips.push(`<span class="cat-chip" data-remove-chip data-key="sectors" data-value="${s}">${s} ×</span>`));
    filters.categories.forEach(c => chips.push(`<span class="cat-chip" data-remove-chip data-key="categories" data-value="${c}">${c} ×</span>`));
    filters.materials.forEach(m => chips.push(`<span class="cat-chip" data-remove-chip data-key="materials" data-value="${m}">${m} ×</span>`));
    filters.standards.forEach(s => chips.push(`<span class="cat-chip" data-remove-chip data-key="standards" data-value="${s}">${s} ×</span>`));
    if (filters.dn)            chips.push(`<span class="cat-chip" data-remove-chip data-key="dn">DN ${filters.dn[0]}–${filters.dn[1]} ×</span>`);
    if (filters.pn)            chips.push(`<span class="cat-chip" data-remove-chip data-key="pn">PN ${filters.pn[0]}–${filters.pn[1]} ×</span>`);
    if (filters.hasDatasheet)  chips.push(`<span class="cat-chip" data-remove-chip data-key="hasDatasheet">Datasheet ×</span>`);
    if (filters.bimAvailable)  chips.push(`<span class="cat-chip" data-remove-chip data-key="bimAvailable">BIM ×</span>`);
    activeChips.innerHTML = chips.join('');
    if (clearBtn) clearBtn.classList.toggle('hidden', chips.length === 0);
  }

  function syncUrl() {
    const qs = encodeFilters(filters);
    const url = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }

  // Search
  let searchTimer: number | undefined;
  searchInput?.addEventListener('input', e => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      filters = { ...filters, search: (e.target as HTMLInputElement).value };
      render();
    }, 200);
  });

  // Checkbox facets
  root.querySelectorAll<HTMLInputElement>('input[data-facet]').forEach(el => {
    el.addEventListener('change', () => {
      const k = el.dataset.facet as keyof Filters;
      if (k === 'hasDatasheet' || k === 'bimAvailable') {
        (filters as any)[k] = el.checked;
      } else {
        const set = new Set<string>(((filters as any)[k] as string[]) ?? []);
        if (el.checked) set.add(el.value); else set.delete(el.value);
        (filters as any)[k] = [...set];
      }
      render();
    });
  });

  // Range sliders
  ['dn', 'pn'].forEach(key => {
    const minEl = root.querySelector<HTMLInputElement>(`[data-range-min="${key}"]`);
    const maxEl = root.querySelector<HTMLInputElement>(`[data-range-max="${key}"]`);
    const minLbl = root.querySelector<HTMLElement>(`[data-range-label-min="${key}"]`);
    const maxLbl = root.querySelector<HTMLElement>(`[data-range-label-max="${key}"]`);
    if (!minEl || !maxEl) return;
    const update = () => {
      let lo = +minEl.value, hi = +maxEl.value;
      if (lo > hi) [lo, hi] = [hi, lo];
      minEl.value = String(lo); maxEl.value = String(hi);
      if (minLbl) minLbl.textContent = String(lo);
      if (maxLbl) maxLbl.textContent = String(hi);
      const fullMin = +minEl.min, fullMax = +maxEl.max;
      const isUntouched = lo === fullMin && hi === fullMax;
      (filters as any)[key] = isUntouched ? undefined : [lo, hi];
      render();
    };
    minEl.addEventListener('input', update);
    maxEl.addEventListener('input', update);
  });

  // Sort
  sortSelect?.addEventListener('change', () => {
    sort = sortSelect.value as SortKey;
    render();
  });

  // View toggle
  root.querySelectorAll<HTMLButtonElement>('[data-catalog-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.catalogView;
      root!.querySelectorAll<HTMLButtonElement>('[data-catalog-view]').forEach(b => {
        const active = b === btn;
        b.setAttribute('aria-pressed', String(active));
        b.classList.toggle('bg-[var(--cat-accent)]', active);
        b.classList.toggle('text-[var(--cat-surface-raised)]', active);
      });
      grid?.classList.toggle('hidden', mode !== 'grid');
      list?.classList.toggle('hidden', mode !== 'list');
      list?.classList.toggle('flex', mode === 'list');
    });
  });

  // Clear all
  clearBtn?.addEventListener('click', () => {
    filters = { ...EMPTY_FILTERS };
    applyUiFromFilters();
    render();
  });

  // Active chip remove
  activeChips?.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-remove-chip]');
    if (!target) return;
    const key = target.dataset.key!;
    const value = target.dataset.value;
    if (key === 'hasDatasheet' || key === 'bimAvailable') (filters as any)[key] = false;
    else if (key === 'dn' || key === 'pn') (filters as any)[key] = undefined;
    else (filters as any)[key] = ((filters as any)[key] as string[]).filter(v => v !== value);
    applyUiFromFilters();
    render();
  });

  // Add to quote — with state subscription (spec §7.1)
  const basket = getBasket();
  function refreshAddButtons() {
    const items = basket.getItems();
    root!.querySelectorAll<HTMLButtonElement>('[data-add-to-quote]').forEach(btn => {
      const inBasket = items.find(i => i.slug === btn.dataset.slug);
      if (inBasket) {
        btn.textContent = `In quote (${inBasket.qty}) ✓`;
        btn.classList.add('cat-btn--primary');
        btn.classList.remove('cat-btn--ghost');
      } else {
        btn.textContent = 'Add to quote';
        btn.classList.remove('cat-btn--primary');
        btn.classList.add('cat-btn--ghost');
      }
      btn.toggleAttribute('disabled', basket.isFull() && !inBasket);
    });
  }
  root.querySelectorAll<HTMLButtonElement>('[data-add-to-quote]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (basket.isFull() && !basket.getItems().find(i => i.slug === btn.dataset.slug)) return;
      basket.add({
        slug: btn.dataset.slug!,
        code: btn.dataset.code || undefined,
        name: btn.dataset.name!,
        thumb: btn.dataset.thumb!,
        qty: 1
      });
    });
  });
  basket.subscribe(refreshAddButtons);

  // Mobile filter drawer (spec §7.3)
  const drawerInner = root.querySelector<HTMLElement>('[data-filter-rail-inner]');
  const drawerOpenBtn = root.querySelector<HTMLButtonElement>('[data-filter-drawer-open]');
  const drawerCloseBtn = root.querySelector<HTMLButtonElement>('[data-filter-drawer-close]');
  const drawerApplyBtn = root.querySelector<HTMLButtonElement>('[data-filter-drawer-apply]');
  const drawerCountEl = root.querySelector<HTMLElement>('[data-filter-drawer-count]');
  const activeCountEl = root.querySelector<HTMLElement>('[data-filter-active-count]');
  function setDrawer(open: boolean) {
    if (!drawerInner) return;
    drawerInner.classList.toggle('hidden', !open);
    drawerInner.classList.toggle('block', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  drawerOpenBtn?.addEventListener('click', () => setDrawer(true));
  drawerCloseBtn?.addEventListener('click', () => setDrawer(false));
  drawerApplyBtn?.addEventListener('click', () => setDrawer(false));

  function activeCount(): number {
    return filters.sectors.length + filters.categories.length + filters.materials.length + filters.standards.length
      + (filters.dn ? 1 : 0) + (filters.pn ? 1 : 0) + (filters.hasDatasheet ? 1 : 0) + (filters.bimAvailable ? 1 : 0);
  }
  function refreshDrawerLabels(filteredCount: number) {
    if (drawerCountEl) drawerCountEl.textContent = String(filteredCount);
    if (activeCountEl) {
      const n = activeCount();
      activeCountEl.textContent = n > 0 ? `(${n})` : '';
    }
  }

  // Drawer labels piggyback on render via MutationObserver of the active-chips region (no listener refactor).
  const drawerObs = new MutationObserver(() => refreshDrawerLabels(applyFilters(products, filters).length));
  if (activeChips) drawerObs.observe(activeChips, { childList: true });

  applyUiFromFilters();
  render();
  refreshAddButtons();
  refreshDrawerLabels(applyFilters(products, filters).length);
}
```

- [ ] **Step 2: Wire script tag into the page**

Add at bottom of `src/pages/catalog/index.astro`, before closing `</Base>`:

```astro
<script>
  import { initCatalogPage } from '~/scripts/catalog/page-init';
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initCatalogPage());
  } else {
    initCatalogPage();
  }
</script>
```

- [ ] **Step 3: Visual smoke — filters work end-to-end**

Run: `npm run dev` → http://localhost:4321/catalog
Manual checks:
- Tick `Agriculture` → product list shrinks, count updates, URL gains `?sectors=agriculture`
- Tick `Industry` (in addition) → list grows back to include industry products
- Move DN slider → list shrinks, chip appears
- Type `NO330` in search → only adaptor-flanged remains
- Click view toggle to List → list view shows
- Click `Clear all` → filters reset, URL is `/catalog`
- Click `Add to quote` on a card → button label changes to `In quote (1) ✓`. `localStorage.getItem('elysee.catalog.quote.v1')` shows the item. Click again → count increments to 2.
- Resize browser to 600px wide: filter rail collapses to a `Filters` button. Click → drawer opens full-screen. Tick a facet, see `Show N results` button update. Click `Show N results` → drawer closes, results filtered. Click `Filters` again → reopen, click `✕` → close.

- [ ] **Step 4: Commit**

```bash
git add src/scripts/catalog/page-init.ts src/pages/catalog/index.astro
git commit -m "feat(catalog): wire filters, sort, view toggle, search, URL sync"
```

---

## Phase 4 — Detail page

### Task 20: Detail page scaffold + getStaticPaths

**Files:**
- Create: `src/pages/catalog/[slug].astro`

- [ ] **Step 1: Create the page**

```astro
---
import Base from '~/layouts/Base.astro';
import { getCollection } from 'astro:content';
import type { CatalogProduct } from '~/scripts/catalog/types';
import DetailHero from '~/components/catalog/DetailHero.astro';
import KeySpecs from '~/components/catalog/KeySpecs.astro';
import SpecTable from '~/components/catalog/SpecTable.astro';
import TabBar from '~/components/catalog/TabBar.astro';
import RelatedProducts from '~/components/catalog/RelatedProducts.astro';
import '~/styles/catalog.css';

export async function getStaticPaths() {
  const products = await getCollection('products');
  return products.map(p => ({ params: { slug: p.slug }, props: { entry: p, all: products } }));
}

const { entry, all } = Astro.props;
const p: CatalogProduct = {
  slug: entry.slug,
  name: entry.data.name, code: entry.data.code, category: entry.data.category, sectors: entry.data.sectors,
  material: entry.data.material, dnRange: entry.data.dnRange, pnRating: entry.data.pnRating, standards: entry.data.standards,
  imageUrls: entry.data.imageUrls, image: entry.data.image, blurb: entry.data.blurb, pressure: entry.data.pressure,
  sizeRange: entry.data.sizeRange, bim: entry.data.bim, datasheet: entry.data.datasheet,
  installation: entry.data.installation, specs: entry.data.specs, featured: entry.data.featured
};
const related: CatalogProduct[] = all
  .filter(x => x.slug !== p.slug && (x.data.category === p.category || x.data.sectors.some(s => p.sectors.includes(s))))
  .slice(0, 4)
  .map(c => ({
    slug: c.slug, name: c.data.name, code: c.data.code, category: c.data.category, sectors: c.data.sectors,
    material: c.data.material, dnRange: c.data.dnRange, pnRating: c.data.pnRating, standards: c.data.standards,
    imageUrls: c.data.imageUrls, image: c.data.image, blurb: c.data.blurb, pressure: c.data.pressure,
    sizeRange: c.data.sizeRange, bim: c.data.bim, datasheet: c.data.datasheet, installation: c.data.installation,
    specs: c.data.specs, featured: c.data.featured
  }));
---
<Base title={`${p.name} — Catalog — Elysee Irrigation`} description={p.blurb}>
  <div class="catalog-scope" data-catalog-detail>
    <main class="page-x py-8">
      <nav aria-label="Breadcrumb" class="cat-mono text-[11px] text-[var(--cat-ink-subtle)]">
        <a href="/" class="hover:text-[var(--cat-accent)]">Home</a>
        <span class="mx-2">/</span>
        <a href="/catalog" class="hover:text-[var(--cat-accent)]">Catalog</a>
        <span class="mx-2">/</span>
        <span aria-current="page">{p.name}</span>
      </nav>
      <DetailHero product={p} />
      <TabBar product={p} />
      <RelatedProducts products={related} />
      <section class="border-t border-[var(--cat-hairline)] mt-12 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 class="cat-display text-2xl">Need this in your project?</h2>
          <p class="text-xs text-[var(--cat-ink-muted)] mt-1">We respond within one business day.</p>
        </div>
        <div class="flex gap-3">
          <button data-add-to-quote data-slug={p.slug} data-name={p.name} data-code={p.code ?? ''} data-thumb={p.imageUrls[0] ?? p.image} class="cat-btn cat-btn--primary">Request a quote</button>
          <a href="/#contact" class="cat-btn cat-btn--ghost">Talk to engineering</a>
        </div>
      </section>
    </main>
  </div>
  <script>
    import { initDetailPage } from '~/scripts/catalog/page-init-detail';
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => initDetailPage()); }
    else { initDetailPage(); }
  </script>
</Base>
```

(`page-init-detail` is created in Task 25.)

- [ ] **Step 2: Commit (build will fail until inner components exist)**

```bash
git add src/pages/catalog/[slug].astro
git commit -m "feat(catalog): detail page scaffold with breadcrumbs, getStaticPaths"
```

---

### Task 21: DetailHero

**Files:**
- Create: `src/components/catalog/DetailHero.astro`

- [ ] **Step 1: Create**

```astro
---
import type { CatalogProduct } from '~/scripts/catalog/types';
import { formatDN, formatPN } from '~/scripts/catalog/format';
import KeySpecs from './KeySpecs.astro';
interface Props { product: CatalogProduct; }
const { product: p } = Astro.props;
const main = p.imageUrls[0] ?? p.image;
---
<section class="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
  <div class="lg:col-span-7">
    <div class="bg-white border border-[var(--cat-hairline)] rounded-md aspect-square flex items-center justify-center">
      <img src={main} alt={p.name} width="800" height="800" class="max-w-full max-h-full object-contain p-8" />
    </div>
    {p.imageUrls.length > 1 && (
      <div class="grid grid-cols-5 gap-2 mt-3">
        {p.imageUrls.slice(0, 5).map(u => <img src={u} alt="" class="bg-white border border-[var(--cat-hairline)] rounded-md aspect-square object-contain p-2" loading="lazy" />)}
      </div>
    )}
  </div>
  <aside class="lg:col-span-5 lg:sticky lg:top-20 self-start flex flex-col gap-4">
    {p.code && <p class="cat-mono text-[11px] text-[var(--cat-ink-subtle)]">{p.code}</p>}
    <h1 class="cat-display text-4xl lg:text-5xl leading-tight">{p.name}</h1>
    <p class="text-sm text-[var(--cat-ink-muted)]">{p.blurb}</p>
    <KeySpecs product={p} />
    <div class="flex flex-col gap-2 mt-2">
      <button data-add-to-quote data-slug={p.slug} data-name={p.name} data-code={p.code ?? ''} data-thumb={main} class="cat-btn cat-btn--primary">Add to quote</button>
      {p.datasheet && <a href={p.datasheet} class="cat-btn cat-btn--ghost"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v4h16v-4"/></svg>Download datasheet</a>}
      {p.bim && <a href="https://elysee.partcommunity.com" class="cat-btn cat-btn--ghost">View BIM</a>}
      {p.slug === 'epsilon' && <a href="/products/epsilon" class="cat-mono text-[11px] text-[var(--cat-accent)] hover:text-[var(--cat-accent-bright)] mt-2">Discover the technology →</a>}
    </div>
  </aside>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/catalog/DetailHero.astro
git commit -m "feat(catalog): detail hero (gallery + sticky info column)"
```

---

### Task 22: KeySpecs (4-stat grid)

**Files:**
- Create: `src/components/catalog/KeySpecs.astro`

- [ ] **Step 1: Create**

```astro
---
import type { CatalogProduct } from '~/scripts/catalog/types';
import { formatDN, formatPN } from '~/scripts/catalog/format';
interface Props { product: CatalogProduct; }
const { product: p } = Astro.props;
const stats = [
  { label: 'Pressure', value: p.pnRating !== undefined ? formatPN(p.pnRating) : p.pressure || '—' },
  { label: 'Size range', value: p.dnRange ? formatDN(p.dnRange) : p.sizeRange || '—' },
  { label: 'Material', value: (p.material ?? '—').split('/')[0].trim() },
  { label: 'Standard', value: p.standards[0] ?? '—' }
];
---
<dl class="grid grid-cols-2 gap-px bg-[var(--cat-hairline)] border border-[var(--cat-hairline)] rounded-md overflow-hidden">
  {stats.map(s => (
    <div class="bg-[var(--cat-surface-raised)] p-3">
      <dt class="cat-mono text-[10px] uppercase tracking-wider text-[var(--cat-ink-subtle)]">{s.label}</dt>
      <dd class="cat-mono text-sm mt-1">{s.value}</dd>
    </div>
  ))}
</dl>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/catalog/KeySpecs.astro
git commit -m "feat(catalog): 4-stat key specs grid"
```

---

### Task 23: SpecTable

**Files:**
- Create: `src/components/catalog/SpecTable.astro`

- [ ] **Step 1: Create**

```astro
---
import type { CatalogProduct } from '~/scripts/catalog/types';
import { formatDN, formatPN, formatSectorList } from '~/scripts/catalog/format';
interface Props { product: CatalogProduct; }
const { product: p } = Astro.props;
const rows: { k: string; v: string }[] = [
  ...(p.code ? [{ k: 'Product code', v: p.code }] : []),
  ...(p.dnRange ? [{ k: 'DN size', v: formatDN(p.dnRange) }] : []),
  ...(p.pnRating !== undefined ? [{ k: 'Pressure rating', v: formatPN(p.pnRating) }] : []),
  ...(p.material ? [{ k: 'Material', v: p.material }] : []),
  ...(p.sectors.length ? [{ k: 'Sectors', v: formatSectorList(p.sectors) }] : []),
  ...p.specs.map(s => ({ k: s.key, v: s.value })),
  ...(p.standards.length ? [{ k: 'Standards', v: p.standards.join(', ') }] : [])
];
---
<table class="cat-table">
  <tbody>
    {rows.map(r => <tr><th scope="row">{r.k}</th><td>{r.v}</td></tr>)}
  </tbody>
</table>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/catalog/SpecTable.astro
git commit -m "feat(catalog): spec table component"
```

---

### Task 24: TabBar (Specifications / Standards / Installation / Related)

**Files:**
- Create: `src/components/catalog/TabBar.astro`

- [ ] **Step 1: Create**

```astro
---
import type { CatalogProduct } from '~/scripts/catalog/types';
import SpecTable from './SpecTable.astro';
interface Props { product: CatalogProduct; }
const { product: p } = Astro.props;
---
<section class="mt-12 border-t border-[var(--cat-hairline)]">
  <div role="tablist" class="sticky top-0 z-10 bg-[var(--cat-surface)] border-b border-[var(--cat-hairline)] flex gap-2 overflow-x-auto">
    <button role="tab" data-tab="spec" aria-selected="true" class="cat-mono text-[11px] uppercase tracking-wider px-4 py-3 border-b-2 border-[var(--cat-accent)]">Specifications</button>
    <button role="tab" data-tab="standards" aria-selected="false" class="cat-mono text-[11px] uppercase tracking-wider px-4 py-3 border-b-2 border-transparent">Standards</button>
    <button role="tab" data-tab="install" aria-selected="false" class="cat-mono text-[11px] uppercase tracking-wider px-4 py-3 border-b-2 border-transparent">Installation</button>
  </div>

  <div role="tabpanel" data-panel="spec" class="py-6">
    <SpecTable product={p} />
  </div>
  <div role="tabpanel" data-panel="standards" class="py-6 hidden">
    {p.standards.length ? (
      <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {p.standards.map(s => (
          <li class="cat-card p-4">
            <p class="cat-mono text-[11px] text-[var(--cat-ink-subtle)]">Standard</p>
            <p class="cat-display text-lg mt-1">{s}</p>
          </li>
        ))}
      </ul>
    ) : <p class="text-sm text-[var(--cat-ink-muted)]">No standards listed.</p>}
  </div>
  <div role="tabpanel" data-panel="install" class="py-6 hidden">
    {p.installation ? (
      <p class="text-sm text-[var(--cat-ink)] max-w-prose whitespace-pre-line">{p.installation}</p>
    ) : <p class="text-sm text-[var(--cat-ink-muted)]">Installation guide coming soon.</p>}
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/catalog/TabBar.astro
git commit -m "feat(catalog): tab bar (Specifications / Standards / Installation)"
```

---

### Task 25: RelatedProducts + page-init-detail

**Files:**
- Create: `src/components/catalog/RelatedProducts.astro`
- Create: `src/scripts/catalog/page-init-detail.ts`

- [ ] **Step 1: Create RelatedProducts**

```astro
---
import type { CatalogProduct } from '~/scripts/catalog/types';
import ProductCard from './ProductCard.astro';
interface Props { products: CatalogProduct[]; }
const { products } = Astro.props;
---
{products.length > 0 && (
  <section class="mt-12">
    <h2 class="cat-display text-2xl mb-4">Related products</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {products.map(p => <ProductCard product={p} />)}
    </div>
  </section>
)}
```

- [ ] **Step 2: Create page-init-detail**

```ts
// src/scripts/catalog/page-init-detail.ts
import { getBasket } from './basket-store';

export function initDetailPage() {
  const root = document.querySelector<HTMLElement>('[data-catalog-detail]');
  if (!root) return;

  // Tabs
  const tabs = root.querySelectorAll<HTMLButtonElement>('[role="tab"]');
  const panels = root.querySelectorAll<HTMLElement>('[role="tabpanel"]');
  tabs.forEach(t => t.addEventListener('click', () => {
    const target = t.dataset.tab!;
    tabs.forEach(b => {
      const active = b === t;
      b.setAttribute('aria-selected', String(active));
      b.classList.toggle('border-[var(--cat-accent)]', active);
      b.classList.toggle('border-transparent', !active);
    });
    panels.forEach(p => p.classList.toggle('hidden', p.dataset.panel !== target));
  }));

  // Add to quote (any [data-add-to-quote] on the page) — with state subscription
  const basket = getBasket();
  function refreshAddButtons() {
    const items = basket.getItems();
    root!.querySelectorAll<HTMLButtonElement>('[data-add-to-quote]').forEach(btn => {
      const inBasket = items.find(i => i.slug === btn.dataset.slug);
      if (inBasket) {
        btn.textContent = `In quote (${inBasket.qty}) ✓`;
      } else {
        // Reset to original: detail page hero uses primary, related cards use ghost.
        // Don't override the class — only the text. The class on the card buttons stays "ghost".
        const isPrimary = btn.classList.contains('cat-btn--primary');
        btn.textContent = isPrimary ? 'Request a quote' : 'Add to quote';
      }
      btn.toggleAttribute('disabled', basket.isFull() && !inBasket);
    });
  }
  root.querySelectorAll<HTMLButtonElement>('[data-add-to-quote]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (basket.isFull() && !basket.getItems().find(i => i.slug === btn.dataset.slug)) return;
      basket.add({
        slug: btn.dataset.slug!,
        code: btn.dataset.code || undefined,
        name: btn.dataset.name!,
        thumb: btn.dataset.thumb!,
        qty: 1
      });
    });
  });
  basket.subscribe(refreshAddButtons);
  refreshAddButtons();
}
```

- [ ] **Step 3: Build and visual smoke**

Run: `npm run build && npm run dev` → http://localhost:4321/catalog/epsilon
Expected: detail page renders. Breadcrumbs, hero with gallery + info column, key specs, tabs (default Specifications). Click `Standards` tab → swaps content. Click `Installation` → swaps content. Related products at bottom.

- [ ] **Step 4: Commit**

```bash
git add src/components/catalog/RelatedProducts.astro src/scripts/catalog/page-init-detail.ts
git commit -m "feat(catalog): related products + detail page tab interactivity"
```

---

## Phase 5 — Quote basket

### Task 26: QuoteBasket pill + drawer

**Files:**
- Create: `src/components/catalog/QuoteBasket.astro`
- Modify: `src/pages/catalog/index.astro`
- Modify: `src/pages/catalog/[slug].astro`

- [ ] **Step 1: Create QuoteBasket**

```astro
---
---
<div data-quote-basket class="catalog-scope fixed inset-0 pointer-events-none z-30">
  <button data-basket-pill type="button" class="hidden pointer-events-auto fixed bottom-6 right-6 cat-btn cat-btn--primary shadow-lg" aria-haspopup="dialog">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 3h2l2 14h11l3-9H6"/></svg>
    Quote (<span data-basket-count>0</span>)
  </button>

  <div data-basket-drawer role="dialog" aria-label="Quote request" aria-modal="true" class="hidden pointer-events-auto fixed top-0 right-0 h-full w-full md:w-[420px] bg-[var(--cat-surface-raised)] border-l border-[var(--cat-hairline)] shadow-xl flex flex-col">
    <header class="flex items-center justify-between border-b border-[var(--cat-hairline)] p-4">
      <h2 class="cat-display text-lg" data-basket-title>Quote request</h2>
      <button data-basket-close type="button" class="cat-mono text-xs" aria-label="Close">✕</button>
    </header>
    <div data-basket-items class="flex-1 overflow-y-auto p-4 flex flex-col gap-3"></div>
    <div data-basket-empty class="flex-1 flex items-center justify-center p-8 text-center text-sm text-[var(--cat-ink-muted)]">
      <p>Your quote basket is empty.<br/>Add products to request a quote.</p>
    </div>
    <footer data-basket-footer class="hidden border-t border-[var(--cat-hairline)] p-4 flex flex-col gap-2">
      <button data-basket-checkout type="button" class="cat-btn cat-btn--primary w-full">Send quote request</button>
      <button data-basket-back-to-list type="button" class="cat-btn cat-btn--ghost w-full hidden">Back to items</button>
    </footer>
    <form data-basket-form class="hidden flex-1 overflow-y-auto p-4 flex flex-col gap-3">
      <label class="flex flex-col gap-1"><span class="cat-mono text-[11px]">Name *</span><input name="name" required class="border border-[var(--cat-hairline-strong)] rounded-sm px-2 py-1.5 bg-[var(--cat-surface)]" /></label>
      <label class="flex flex-col gap-1"><span class="cat-mono text-[11px]">Company</span><input name="company" class="border border-[var(--cat-hairline-strong)] rounded-sm px-2 py-1.5 bg-[var(--cat-surface)]" /></label>
      <label class="flex flex-col gap-1"><span class="cat-mono text-[11px]">Email *</span><input name="email" type="email" required class="border border-[var(--cat-hairline-strong)] rounded-sm px-2 py-1.5 bg-[var(--cat-surface)]" /></label>
      <label class="flex flex-col gap-1"><span class="cat-mono text-[11px]">Phone</span><input name="phone" class="border border-[var(--cat-hairline-strong)] rounded-sm px-2 py-1.5 bg-[var(--cat-surface)]" /></label>
      <label class="flex flex-col gap-1"><span class="cat-mono text-[11px]">Project notes</span><textarea name="notes" rows="4" class="border border-[var(--cat-hairline-strong)] rounded-sm px-2 py-1.5 bg-[var(--cat-surface)]"></textarea></label>
      <button type="submit" class="cat-btn cat-btn--primary w-full">Send request</button>
    </form>
    <div data-basket-success class="hidden flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
      <p class="cat-display text-2xl">Thanks.</p>
      <p class="text-sm text-[var(--cat-ink-muted)]">We'll be in touch within one business day.</p>
      <button data-basket-close type="button" class="cat-btn cat-btn--ghost mt-3">Close</button>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Wire into both catalog pages**

In `src/pages/catalog/index.astro` and `src/pages/catalog/[slug].astro`, add:

```astro
import QuoteBasket from '~/components/catalog/QuoteBasket.astro';
```

(in frontmatter imports), and just before `</Base>`:

```astro
<QuoteBasket />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/catalog/QuoteBasket.astro src/pages/catalog/index.astro src/pages/catalog/[slug].astro
git commit -m "feat(catalog): quote basket pill + drawer markup"
```

---

### Task 27: Quote submission stub (client-side, no backend)

**Files:** none — this task is informational; submit handler is implemented client-side in Task 28.

The spec's `/api/quote` endpoint is replaced with a **client-side stub**: `console.log` of the payload + a 600ms artificial delay + success state. Reasoning: a real POST endpoint in Astro 5 requires `output: 'server'` plus a Node/Vercel/Netlify adapter, which is unnecessary infrastructure for a demo whose acceptance criterion is "form submission stubbed (logs to console + success state)" (spec §2.2). The static build stays static — no `astro.config.mjs` changes, no per-page `prerender` exports.

No commit for this task — proceed to Task 28.

---

### Task 28: Wire QuoteBasket interactivity

**Files:**
- Create: `src/scripts/catalog/basket-ui.ts`
- Modify: `src/pages/catalog/index.astro` (script block)
- Modify: `src/pages/catalog/[slug].astro` (script block)

- [ ] **Step 1: Create basket-ui**

```ts
// src/scripts/catalog/basket-ui.ts
import { getBasket } from './basket-store';
import type { BasketItem } from './types';

export function initBasketUi() {
  const root = document.querySelector<HTMLElement>('[data-quote-basket]');
  if (!root) return;

  const pill        = root.querySelector<HTMLButtonElement>('[data-basket-pill]')!;
  const countEl     = root.querySelector<HTMLElement>('[data-basket-count]')!;
  const drawer      = root.querySelector<HTMLElement>('[data-basket-drawer]')!;
  const closeBtn    = root.querySelector<HTMLButtonElement>('[data-basket-close]')!;
  const itemsList   = root.querySelector<HTMLElement>('[data-basket-items]')!;
  const emptyState  = root.querySelector<HTMLElement>('[data-basket-empty]')!;
  const footer      = root.querySelector<HTMLElement>('[data-basket-footer]')!;
  const checkoutBtn = root.querySelector<HTMLButtonElement>('[data-basket-checkout]')!;
  const backBtn     = root.querySelector<HTMLButtonElement>('[data-basket-back-to-list]')!;
  const form        = root.querySelector<HTMLFormElement>('[data-basket-form]')!;
  const success     = root.querySelector<HTMLElement>('[data-basket-success]')!;
  const titleEl     = root.querySelector<HTMLElement>('[data-basket-title]')!;

  const basket = getBasket();
  let lastFocused: HTMLElement | null = null;

  function renderItems() {
    const items = basket.getItems();
    const count = basket.getCount();
    countEl.textContent = String(count);
    pill.classList.toggle('hidden', count === 0);
    titleEl.textContent = `Quote request (${items.length} item${items.length === 1 ? '' : 's'})`;
    if (items.length === 0) {
      itemsList.innerHTML = '';
      itemsList.classList.add('hidden');
      emptyState.classList.remove('hidden');
      footer.classList.add('hidden');
      return;
    }
    emptyState.classList.add('hidden');
    itemsList.classList.remove('hidden');
    footer.classList.remove('hidden');
    itemsList.innerHTML = items.map(it => `
      <article class="flex gap-3 items-center border-b border-[var(--cat-hairline)] pb-3">
        <img src="${it.thumb}" alt="" width="60" height="60" class="bg-white border border-[var(--cat-hairline)] rounded object-contain p-1" />
        <div class="flex-1 min-w-0">
          ${it.code ? `<p class="cat-mono text-[10px] text-[var(--cat-ink-subtle)]">${it.code}</p>` : ''}
          <p class="text-sm truncate">${it.name}</p>
        </div>
        <input type="number" min="1" max="99" value="${it.qty}" data-basket-qty data-slug="${it.slug}" class="cat-mono text-xs w-14 border border-[var(--cat-hairline-strong)] rounded-sm px-1 py-0.5 text-center" aria-label="Quantity" />
        <button type="button" data-basket-remove data-slug="${it.slug}" class="cat-mono text-xs px-1" aria-label="Remove">✕</button>
      </article>
    `).join('');
  }

  function open() {
    lastFocused = document.activeElement as HTMLElement;
    drawer.classList.remove('hidden');
    drawer.classList.add('flex');
    closeBtn.focus();
  }
  function close() {
    drawer.classList.add('hidden');
    drawer.classList.remove('flex');
    showItemsView();
    lastFocused?.focus();
  }
  function showItemsView() {
    form.classList.add('hidden');
    success.classList.add('hidden');
    itemsList.classList.toggle('hidden', basket.getItems().length === 0);
    if (basket.getItems().length > 0) footer.classList.remove('hidden');
    backBtn.classList.add('hidden');
  }
  function showFormView() {
    itemsList.classList.add('hidden');
    emptyState.classList.add('hidden');
    footer.classList.add('hidden');
    success.classList.add('hidden');
    form.classList.remove('hidden');
    backBtn.classList.remove('hidden');
  }
  function showSuccess() {
    itemsList.classList.add('hidden');
    emptyState.classList.add('hidden');
    footer.classList.add('hidden');
    form.classList.add('hidden');
    success.classList.remove('hidden');
  }

  pill.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  drawer.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  itemsList.addEventListener('input', (e) => {
    const t = e.target as HTMLElement;
    if (t.matches('[data-basket-qty]')) {
      const input = t as HTMLInputElement;
      const qty = Math.max(1, Math.min(99, +input.value || 1));
      basket.setQty(input.dataset.slug!, qty);
    }
  });
  itemsList.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-basket-remove]');
    if (t) basket.remove(t.dataset.slug!);
  });

  checkoutBtn.addEventListener('click', () => {
    if (basket.getItems().length === 0) return;
    showFormView();
  });
  backBtn.addEventListener('click', showItemsView);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const payload = { ...data, items: basket.getItems() };
    // Client-side stub (see Task 27): log + simulate latency + success.
    console.log('[quote-request]', payload);
    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
    await new Promise(r => setTimeout(r, 600));
    basket.clear();
    form.reset();
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send request'; }
    showSuccess();
  });

  basket.subscribe(renderItems);
  renderItems();
}
```

- [ ] **Step 2: Wire into both catalog pages**

In the `<script>` block of `src/pages/catalog/index.astro`, change:

```astro
<script>
  import { initCatalogPage } from '~/scripts/catalog/page-init';
  import { initBasketUi } from '~/scripts/catalog/basket-ui';
  function go() { initCatalogPage(); initBasketUi(); }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', go); }
  else { go(); }
</script>
```

In `src/pages/catalog/[slug].astro`, similarly change to:

```astro
<script>
  import { initDetailPage } from '~/scripts/catalog/page-init-detail';
  import { initBasketUi } from '~/scripts/catalog/basket-ui';
  function go() { initDetailPage(); initBasketUi(); }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', go); }
  else { go(); }
</script>
```

- [ ] **Step 3: Visual smoke**

Run: `npm run dev` → http://localhost:4321/catalog
Manual check:
- Click `Add to quote` on a card → pill appears bottom-right, count increments
- Click pill → drawer opens with item, qty input, remove button
- Change qty → store updates (refresh page to verify persistence)
- Click `Send quote request` → form view; submit → success state; basket cleared, pill hidden
- Press ESC inside drawer → drawer closes

- [ ] **Step 4: Commit**

```bash
git add src/scripts/catalog/basket-ui.ts src/pages/catalog/index.astro src/pages/catalog/[slug].astro
git commit -m "feat(catalog): quote basket interactivity (drawer, form, submit)"
```

---

## Phase 6 — Wiring + nav

### Task 29: Add `Catalog (preview)` to global nav

**Files:**
- Modify: `src/components/ui/Nav.astro`

- [ ] **Step 1: Read the nav**

Run: `grep -n "Products\|Insights\|Contact" src/components/ui/Nav.astro` to locate the existing links structure.

- [ ] **Step 2: Add the link**

Add a new `<a>` immediately after the existing `Products` link, matching the same className and structure exactly. The link target is `/catalog` and the label is `Catalog (preview)`.

- [ ] **Step 3: Visual smoke**

Run: `npm run dev` → http://localhost:4321/
Expected: nav shows new `Catalog (preview)` link; clicking goes to `/catalog`.

- [ ] **Step 4: Verify existing routes still render unchanged**

Run: visit `/`, `/products`, `/products/epsilon` — confirm the cinematic site is identical to before (the nav has one extra link; everything else is the same).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Nav.astro
git commit -m "feat(nav): add Catalog (preview) link"
```

---

### Task 30: README note

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Append a section at the bottom**

Add at the end of `README.md`:

```markdown
## Catalog (preview)

A second design direction for the products section, modelled on RS Delivers.
Lives at `/catalog` and `/catalog/[slug]`. Coexists with the cinematic
`/products` and `/products/epsilon` pages. See spec at
`docs/superpowers/specs/2026-04-27-products-rs-catalog-demo-design.md` and plan
at `docs/superpowers/plans/2026-04-27-products-rs-catalog-demo.md`.

To import an Excel of more products: `node scripts/catalog/import-excel.ts <path-to-xlsx>`.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: note about /catalog preview"
```

---

## Phase 7 — Excel import script

### Task 31: import-excel.ts

**Files:**
- Create: `scripts/catalog/import-excel.ts`

- [ ] **Step 1: Create the script**

```ts
// scripts/catalog/import-excel.ts
// Usage: node --experimental-strip-types scripts/catalog/import-excel.ts <path-to-xlsx> [--force]
// Or compile via tsc and run the .js. The script avoids any Astro imports.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import * as XLSX from 'xlsx';

interface Row {
  code?: string; name?: string; category?: string; sectors?: string;
  material?: string; dn_min?: number; dn_max?: number; pn?: number;
  blurb?: string; specs?: string; standards?: string;
  image_url?: string; datasheet_url?: string; bim?: string | boolean; featured?: string | boolean;
}

const SECTORS = new Set(['agriculture', 'landscape', 'building', 'industry']);
const CATEGORIES = new Set(['compression-fittings', 'pvc-ball-valves', 'saddles', 'adaptor-flanged', 'couplings', 'valves']);

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function csv(s?: string): string[] {
  return s ? s.split(',').map(v => v.trim()).filter(Boolean) : [];
}

function bool(v: string | boolean | undefined): boolean {
  if (typeof v === 'boolean') return v;
  if (!v) return false;
  return /^(true|1|yes|y)$/i.test(String(v).trim());
}

function rowToMdx(row: Row, errors: string[]): { slug: string; content: string } | null {
  if (!row.code || !row.name || !row.category) {
    errors.push(`row missing required fields (code, name, category): ${JSON.stringify(row)}`);
    return null;
  }
  if (!CATEGORIES.has(row.category)) {
    errors.push(`row ${row.code}: unknown category "${row.category}"`);
    return null;
  }
  const sectors = csv(row.sectors).filter(s => SECTORS.has(s));
  const standards = csv(row.standards);
  let specsArr: { key: string; value: string }[] = [];
  if (row.specs) {
    try { specsArr = JSON.parse(row.specs); }
    catch { errors.push(`row ${row.code}: invalid specs JSON, skipping specs field`); }
  }
  const slug = slugify(row.code);
  const lines: string[] = ['---'];
  lines.push(`name: ${JSON.stringify(row.name)}`);
  lines.push(`category: ${row.category}`);
  lines.push(`code: ${row.code}`);
  if (sectors.length) lines.push(`sectors: [${sectors.join(', ')}]`);
  if (row.material) lines.push(`material: ${JSON.stringify(row.material)}`);
  if (row.dn_min !== undefined && row.dn_max !== undefined) lines.push(`dnRange: [${row.dn_min}, ${row.dn_max}]`);
  if (row.pn !== undefined) lines.push(`pnRating: ${row.pn}`);
  if (standards.length) lines.push(`standards: [${standards.map(s => JSON.stringify(s)).join(', ')}]`);
  lines.push(`pressure: ${JSON.stringify(row.pn !== undefined ? `${row.pn} bar` : '')}`);
  lines.push(`sizeRange: ${JSON.stringify(row.dn_min !== undefined && row.dn_max !== undefined ? `Ø${row.dn_min}–Ø${row.dn_max}` : '')}`);
  lines.push(`blurb: ${JSON.stringify(row.blurb ?? '')}`);
  lines.push(`image: ${JSON.stringify(row.image_url ?? '/images/products/placeholder.svg')}`);
  if (row.image_url) lines.push(`imageUrls: [${JSON.stringify(row.image_url)}]`);
  if (specsArr.length) {
    lines.push('specs:');
    for (const s of specsArr) lines.push(`  - { key: ${JSON.stringify(s.key)}, value: ${JSON.stringify(s.value)} }`);
  }
  lines.push(`bim: ${bool(row.bim)}`);
  lines.push(`featured: ${bool(row.featured)}`);
  if (row.datasheet_url) lines.push(`datasheet: ${JSON.stringify(row.datasheet_url)}`);
  lines.push('---');
  lines.push('');
  lines.push(row.blurb ?? '');
  lines.push('');
  return { slug, content: lines.join('\n') };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) { console.error('usage: import-excel.ts <xlsx> [--force]'); process.exit(1); }
  const xlsxPath = resolve(args[0]);
  const force = args.includes('--force');
  if (!existsSync(xlsxPath)) { console.error(`file not found: ${xlsxPath}`); process.exit(1); }

  const wb = XLSX.readFile(xlsxPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: Row[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const outDir = join(process.cwd(), 'src/content/products');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const errors: string[] = [];
  let written = 0, skipped = 0;
  for (const row of rows) {
    // normalize keys to lowercase
    const norm: Row = {};
    for (const [k, v] of Object.entries(row)) (norm as any)[k.toLowerCase()] = v;
    const result = rowToMdx(norm, errors);
    if (!result) continue;
    const filePath = join(outDir, `${result.slug}.mdx`);
    if (existsSync(filePath) && !force) {
      console.warn(`skip existing: ${filePath}`);
      skipped++; continue;
    }
    writeFileSync(filePath, result.content);
    written++;
  }
  console.log(`wrote ${written}, skipped ${skipped}`);
  if (errors.length) {
    console.warn(`${errors.length} row error(s):`);
    for (const e of errors) console.warn(' ', e);
  }
}

main();
```

- [ ] **Step 2: Smoke test the script**

Build a minimal test xlsx using Node:

```bash
node -e "const X=require('xlsx');const wb=X.utils.book_new();const ws=X.utils.json_to_sheet([{code:'TEST-001',name:'Test Fitting',category:'compression-fittings',sectors:'agriculture',material:'POM',dn_min:20,dn_max:50,pn:16,standards:'ISO 17885',blurb:'Test row',image_url:'/images/products/placeholder.svg',bim:'true',featured:'false'}]);X.utils.book_append_sheet(wb,ws,'Sheet1');X.writeFile(wb,'/tmp/test-products.xlsx');"
```

Run: `node --experimental-strip-types scripts/catalog/import-excel.ts /tmp/test-products.xlsx --force`
Expected: writes `src/content/products/test-001.mdx`. Open and verify frontmatter is well-formed.

- [ ] **Step 3: Verify schema validates the imported product**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 4: Clean up the smoke product**

Run: `rm src/content/products/test-001.mdx /tmp/test-products.xlsx`

- [ ] **Step 5: Commit**

```bash
git add scripts/catalog/import-excel.ts
git commit -m "feat(catalog): Excel → MDX import script"
```

---

## Phase 8 — Integration test + final verification

### Task 32: Integration smoke test

**Files:**
- Create: `tests/catalogIntegration.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/catalogIntegration.test.ts
import { describe, it, expect } from 'vitest';
import { applyFilters, sortProducts } from '~/scripts/catalog/filter-engine';
import { deriveFacets } from '~/scripts/catalog/derive-facets';
import { encodeFilters, decodeFilters } from '~/scripts/catalog/url-state';
import { EMPTY_FILTERS, type CatalogProduct } from '~/scripts/catalog/types';

// Recreate the 8 demo products' minimal shape from the MDX migration data.
// (Names, codes, dnRange, pnRating, sectors, material, and standards mirror the actual MDX files.)
const demo: CatalogProduct[] = [
  { slug: 'epsilon',             name: 'Epsilon Series',           code: 'EPS-PE-001', category: 'compression-fittings', sectors: ['agriculture','landscape'],            material: 'POM body / EPDM seal',                       dnRange: [20, 110],  pnRating: 16, standards: ['ISO 17885','WRAS','KIWA'], imageUrls: [], image: '', blurb: '', pressure: '16 bar',  sizeRange: 'Ø20–Ø110',  bim: true,  specs: [], featured: true  },
  { slug: 'adaptor-flanged',     name: 'Adaptor Flanged Set',      code: 'NO330D',     category: 'adaptor-flanged',      sectors: ['building','industry'],                material: 'PVC-U flange / EPDM gasket',                 dnRange: [50, 160],  pnRating: 16, standards: ['EN 1452','DIN 8061'],      imageUrls: [], image: '', blurb: '', pressure: '',        sizeRange: '',          bim: false, specs: [], featured: false },
  { slug: 'coupling-repair',     name: 'Coupling Repair',          code: 'NO331B',     category: 'couplings',            sectors: ['agriculture','building'],             material: 'PP body / EPDM seal',                        dnRange: [20, 110],  pnRating: 16, standards: ['ISO 14236'],               imageUrls: [], image: '', blurb: '', pressure: '',        sizeRange: '',          bim: false, specs: [], featured: false },
  { slug: 'coupling-transition', name: 'Coupling Global Transition', code: 'NO321D',  category: 'couplings',            sectors: ['agriculture','landscape','building'], material: 'PP body / brass insert / EPDM seal',         dnRange: [20, 63],   pnRating: 16, standards: ['ISO 14236'],               imageUrls: [], image: '', blurb: '', pressure: '',        sizeRange: '',          bim: false, specs: [], featured: false },
  { slug: 'single-4-bolts',      name: 'Single 4-bolts Flange',    code: 'NO550V',     category: 'adaptor-flanged',      sectors: ['building','industry'],                material: 'Ductile iron flange / EPDM gasket / steel bolts', dnRange: [110, 315], pnRating: 10, standards: ['EN 1092-1'],            imageUrls: [], image: '', blurb: '', pressure: '',        sizeRange: '',          bim: false, specs: [], featured: false },
  { slug: 'double-union-glued',  name: 'Double Union Glued',       code: 'NO108F',     category: 'valves',               sectors: ['building','industry'],                material: 'PVC-U body / EPDM o-rings',                  dnRange: [20, 63],   pnRating: 16, standards: ['EN 1452'],                 imageUrls: [], image: '', blurb: '', pressure: '',        sizeRange: '',          bim: false, specs: [], featured: false },
  { slug: 'pvc-ball-valve',      name: 'PVC Ball Valve',           code: 'PVC-BV-50',  category: 'pvc-ball-valves',      sectors: ['building','landscape'],               material: 'PVC-U body / PTFE seat / EPDM o-ring',       dnRange: [20, 110],  pnRating: 16, standards: ['EN 1452','DIN 8061'],      imageUrls: [], image: '', blurb: '', pressure: '',        sizeRange: '',          bim: false, specs: [], featured: false },
  { slug: 'saddle-clamp',        name: 'Saddle Clamp',             code: 'SDL-CL-32',  category: 'saddles',              sectors: ['agriculture','landscape','industry'], material: 'PP saddle / EPDM gasket / stainless bolts',  dnRange: [63, 315],  pnRating: 16, standards: ['ISO 8085'],                imageUrls: [], image: '', blurb: '', pressure: '',        sizeRange: '',          bim: false, specs: [], featured: false }
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
});
```

- [ ] **Step 2: Run all tests**

Run: `npm run test`
Expected: all tests pass — existing 4 + new 7 catalog test files.

- [ ] **Step 3: Commit**

```bash
git add tests/catalogIntegration.test.ts
git commit -m "test(catalog): integration smoke covering filter+sort+url over demo set"
```

---

### Task 33: Final verification

**Files:** none — verification only.

- [ ] **Step 1: Run type check**

Run: `npm run check`
Expected: PASS, no TypeScript errors.

- [ ] **Step 2: Run tests**

Run: `npm run test`
Expected: all green.

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: build succeeds. Inspect `dist/` and confirm:
- `dist/index.html` exists (homepage)
- `dist/products/index.html` exists (cinematic products)
- `dist/products/epsilon/index.html` exists (cinematic Epsilon)
- `dist/catalog/index.html` exists (new catalog)
- `dist/catalog/[slug]/index.html` exists for each of the 8 products (no `dist/server/` — site stays fully static)

- [ ] **Step 4: Manual regression check**

Run: `npm run preview`. Visit:
- `/` — homepage; verify it looks identical to before (cinematic, particle flow, hero, etc.)
- `/products` — cinematic products page unchanged
- `/products/epsilon` — cinematic 5-act page unchanged
- `/catalog` — new catalog index works (filter, search, sort, view toggle, basket)
- `/catalog/epsilon` — detail page works, has `Discover the technology →` link to `/products/epsilon`
- `/catalog/adaptor-flanged` — detail page works, image loads from elysee.com.cy CDN

If any image fails CORS or 404s from elysee.com.cy, mirror the file locally:
```bash
mkdir -p public/images/products/elysee
curl -o public/images/products/elysee/no330d.jpg https://elysee.com.cy/portal-img/default/246/no330d-a-adaptor-flanged-set-1.jpg
# update the imageUrls in the corresponding MDX
```

- [ ] **Step 5: Lighthouse spot-check**

In Chrome DevTools, run Lighthouse on `/catalog` (mobile + desktop).
Expected: Performance ≥ 95, Accessibility = 100, Best Practices ≥ 95.
Record results. If accessibility < 100, address the specific issue (often missing labels) before merging.

- [ ] **Step 6: Final commit**

If you made any fixes during regression, commit them as a single `fix(catalog): post-QA fixes` commit.

```bash
git status
# stage and commit any pending changes; otherwise, no commit needed
```

---

## Done when

All Task-33 acceptance points pass. The client demo URL is `/catalog`. The cinematic site is unchanged. The Excel import script works and the schema accepts imported products. Hand the URL to the user for client review.

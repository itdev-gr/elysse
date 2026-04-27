# Catalog Country Gate — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a required country picker modal on `/catalog` and `/catalog/[slug]` that scopes the catalog to one of three placeholder countries, persisting the choice in `localStorage`.

**Architecture:** A new `Country` literal union and `availableCountries: Country[]` field on every product. A small storage module (`country.ts`) reads/writes the choice. A pre-filter (`byCountry`) narrows the product list before the existing filter engine runs. A blocking modal component renders on both catalog pages and gates `initCatalogPage`/`initDetailPage` until the user picks. No SSR. No build-time per-country pages.

**Tech Stack:** Astro 5 · Tailwind v4 · MDX · Vitest · TypeScript · vanilla DOM (no React/Vue).

**Spec:** `docs/superpowers/specs/2026-04-27-catalog-country-gate-design.md`

---

## File overview

**New files:**
- `src/components/catalog/CountryModal.astro` — modal markup
- `src/scripts/catalog/country.ts` — storage read/write
- `src/scripts/catalog/country-modal.ts` — show/hide/focus trap/click handler
- `tests/catalogCountry.test.ts` — storage tests
- `tests/catalogByCountry.test.ts` — filter helper tests

**Modified files:**
- `src/scripts/catalog/types.ts` — add `Country`, `COUNTRIES`, `availableCountries`
- `src/scripts/catalog/filter-engine.ts` — add `byCountry`
- `src/scripts/catalog/page-init.ts` — accept `country`, apply `byCountry` at start
- `src/scripts/catalog/page-init-detail.ts` — accept `country`, render "not available" notice
- `src/pages/catalog/index.astro` — render modal, gate init on pick, pass `availableCountries` through mapping
- `src/pages/catalog/[slug].astro` — render modal, gate init, pass `availableCountries`, expose slug to detail init
- `src/content/config.ts` — add `availableCountries` to products schema
- `src/content/products/*.mdx` (8 files) — add `availableCountries` per spec §4.3
- `src/styles/catalog.css` — modal styles
- `tests/catalogIntegration.test.ts` — extend with country-3 case + supply `availableCountries` on all demo entries
- `tests/catalogFilterEngine.test.ts` — supply `availableCountries` default in `product()` factory

---

## Task 1: Add Country type and COUNTRIES constant

**Files:**
- Modify: `src/scripts/catalog/types.ts`

Adds the literal union and label list. No behavior change yet — `CatalogProduct` is **not** modified in this task (that comes in Task 4 along with the schema/MDX migration, so all the changes ship together and tests stay green).

- [ ] **Step 1: Edit `src/scripts/catalog/types.ts` to add Country and COUNTRIES at the top of the file (after the existing `Sector` and `Category` types):**

```ts
export type Sector = 'agriculture' | 'landscape' | 'building' | 'industry';
export type Category = 'compression-fittings' | 'pvc-ball-valves' | 'saddles' | 'adaptor-flanged' | 'couplings' | 'valves';

export type Country = 'country-1' | 'country-2' | 'country-3';

export const COUNTRIES: ReadonlyArray<{ id: Country; label: string }> = [
  { id: 'country-1', label: 'Country 1' },
  { id: 'country-2', label: 'Country 2' },
  { id: 'country-3', label: 'Country 3' },
] as const;
```

(Leave the rest of the file unchanged.)

- [ ] **Step 2: Run typecheck**

Run: `npm run check`
Expected: PASS — no errors. (No consumers of `Country` yet; nothing should break.)

- [ ] **Step 3: Commit**

```bash
git add src/scripts/catalog/types.ts
git commit -m "feat(catalog): add Country type and COUNTRIES constant"
```

---

## Task 2: Storage module with TDD

**Files:**
- Create: `src/scripts/catalog/country.ts`
- Test: `tests/catalogCountry.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/catalogCountry.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readCountry, writeCountry } from '~/scripts/catalog/country';

describe('country storage', () => {
  beforeEach(() => { localStorage.clear(); });

  it('returns null when nothing stored', () => {
    expect(readCountry()).toBeNull();
  });

  it('round-trips a valid country', () => {
    writeCountry('country-2');
    expect(readCountry()).toBe('country-2');
  });

  it('returns null for an invalid stored value', () => {
    localStorage.setItem('elysee.country', 'not-a-country');
    expect(readCountry()).toBeNull();
  });

  it('returns null when localStorage getter throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    try { expect(readCountry()).toBeNull(); }
    finally { spy.mockRestore(); }
  });

  it('swallows errors from setItem (does not throw)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    try { expect(() => writeCountry('country-1')).not.toThrow(); }
    finally { spy.mockRestore(); }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/catalogCountry.test.ts`
Expected: FAIL with "Cannot find module '~/scripts/catalog/country'" or equivalent resolution error.

- [ ] **Step 3: Write the implementation**

Create `src/scripts/catalog/country.ts`:

```ts
import type { Country } from './types';
import { COUNTRIES } from './types';

const KEY = 'elysee.country';
const VALID: ReadonlySet<Country> = new Set(COUNTRIES.map(c => c.id));

export function readCountry(): Country | null {
  try {
    const v = localStorage.getItem(KEY);
    return v && VALID.has(v as Country) ? (v as Country) : null;
  } catch {
    return null;
  }
}

export function writeCountry(c: Country): void {
  try { localStorage.setItem(KEY, c); }
  catch { /* private mode */ }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/catalogCountry.test.ts`
Expected: PASS — all 5 cases.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/catalog/country.ts tests/catalogCountry.test.ts
git commit -m "feat(catalog): add country localStorage module with validation"
```

---

## Task 3: byCountry filter helper with TDD

**Files:**
- Modify: `src/scripts/catalog/filter-engine.ts`
- Test: `tests/catalogByCountry.test.ts`

This task adds the helper but doesn't add `availableCountries` to `CatalogProduct` yet — the test constructs minimal products with the field directly via a cast, then Task 4 makes the field officially part of the type.

- [ ] **Step 1: Write the failing test**

Create `tests/catalogByCountry.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { byCountry } from '~/scripts/catalog/filter-engine';
import type { CatalogProduct, Country } from '~/scripts/catalog/types';

const make = (slug: string, countries: Country[]): CatalogProduct => ({
  slug,
  name: slug,
  category: 'valves',
  sectors: [],
  standards: [],
  imageUrls: [],
  image: '',
  blurb: '',
  pressure: '',
  sizeRange: '',
  bim: false,
  specs: [],
  featured: false,
  availableCountries: countries,
});

describe('byCountry', () => {
  const products: CatalogProduct[] = [
    make('a', ['country-1']),
    make('b', ['country-1', 'country-2']),
    make('c', ['country-2', 'country-3']),
    make('d', ['country-3']),
  ];

  it('returns only products available in the country', () => {
    expect(byCountry(products, 'country-1').map(p => p.slug)).toEqual(['a', 'b']);
    expect(byCountry(products, 'country-2').map(p => p.slug)).toEqual(['b', 'c']);
    expect(byCountry(products, 'country-3').map(p => p.slug)).toEqual(['c', 'd']);
  });

  it('returns empty array when no product available', () => {
    const none: CatalogProduct[] = [make('x', ['country-1'])];
    expect(byCountry(none, 'country-3')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/catalogByCountry.test.ts`
Expected: FAIL — `byCountry` is not exported, and `availableCountries` is not on `CatalogProduct` yet (TS error). This is OK — Vitest with default config still runs JS even with TS errors. If the run is blocked entirely, that's also a valid "fail" — proceed to Step 3.

- [ ] **Step 3: Add `byCountry` to `src/scripts/catalog/filter-engine.ts`**

Change the imports at the top and append the helper:

```ts
import type { CatalogProduct, Country, Filters, SortKey } from './types';
import { search } from './mini-search';

function rangesOverlap(a: [number, number], b: [number, number]): boolean {
  return a[0] <= b[1] && b[0] <= a[1];
}

export function byCountry(products: CatalogProduct[], country: Country): CatalogProduct[] {
  return products.filter(p => p.availableCountries.includes(country));
}

export function applyFilters(products: CatalogProduct[], f: Filters): CatalogProduct[] {
  // ... unchanged ...
```

(Keep `applyFilters` and `sortProducts` exactly as they are. Only add the `Country` import and the `byCountry` function.)

Note: this leaves a temporary type error on `p.availableCountries` because Task 4 adds the field to the `CatalogProduct` interface. That's fine — Task 4 immediately follows and resolves it. If you want to verify the helper alone works, run only `tests/catalogByCountry.test.ts` and skip `npm run check` until Task 4.

- [ ] **Step 4: Run test (skip type-check, just run vitest)**

Run: `npx vitest run tests/catalogByCountry.test.ts`
Expected: PASS — both cases pass.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/catalog/filter-engine.ts tests/catalogByCountry.test.ts
git commit -m "feat(catalog): add byCountry filter helper"
```

---

## Task 4: Add availableCountries to type, schema, and all MDX files

**Files:**
- Modify: `src/scripts/catalog/types.ts`
- Modify: `src/content/config.ts`
- Modify: `src/content/products/*.mdx` (all 8 files)
- Modify: `src/pages/catalog/index.astro` (mapping + JSON inclusion)
- Modify: `src/pages/catalog/[slug].astro` (mapping)
- Modify: `tests/catalogFilterEngine.test.ts` (factory default)
- Modify: `tests/catalogIntegration.test.ts` (demo data)

This is the bulk migration. Group these in one commit because they must move together — leaving any out fails `astro check` or breaks tests.

- [ ] **Step 1: Add the field to the `CatalogProduct` interface**

In `src/scripts/catalog/types.ts`, modify the `CatalogProduct` interface to add the field at the end (just before the closing `}`):

```ts
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
```

- [ ] **Step 2: Update the Zod schema in `src/content/config.ts`**

Replace the products `defineCollection` block with this version (adds `availableCountries` as a required, non-empty array of the country enum):

```ts
import { defineCollection, z } from 'astro:content';

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
    installation: z.string().optional(),

    availableCountries: z.array(z.enum(['country-1', 'country-2', 'country-3'])).nonempty()
  })
});
```

(Keep the `sectors` and `insights` collections unchanged.)

- [ ] **Step 3: Update all 8 MDX files with `availableCountries`**

For each file, append a new line `availableCountries: [...]` to the frontmatter (just before the closing `---`). Use the spec §4.3 distribution:

`src/content/products/epsilon.mdx` — add: `availableCountries: [country-1, country-2]`
`src/content/products/saddle-clamp.mdx` — add: `availableCountries: [country-1, country-3]`
`src/content/products/pvc-ball-valve.mdx` — add: `availableCountries: [country-1, country-3]`
`src/content/products/double-union-glued.mdx` — add: `availableCountries: [country-1]`
`src/content/products/coupling-repair.mdx` — add: `availableCountries: [country-1]`
`src/content/products/adaptor-flanged.mdx` — add: `availableCountries: [country-2]`
`src/content/products/single-4-bolts.mdx` — add: `availableCountries: [country-2, country-3]`
`src/content/products/coupling-transition.mdx` — add: `availableCountries: [country-2]`

Concrete example for `saddle-clamp.mdx` — the frontmatter becomes:

```mdx
---
name: Saddle Clamp
category: saddles
blurb: Tapping saddle for PE mains — fast branch connections without cutting the line.
pressure: 16 bar
sizeRange: Ø63–Ø315
featured: false
image: /images/products/saddle-clamp.svg
# code synthesized — Elysee doesn't publish a single SKU for this fitting
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
availableCountries: [country-1, country-3]
---
```

Apply the same pattern to all 8 files.

- [ ] **Step 4: Update the product mapping in `src/pages/catalog/index.astro`**

In the `const products: CatalogProduct[] = collection.map(...)` block, add `availableCountries: c.data.availableCountries` to the returned object. Final mapping:

```ts
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
  featured: c.data.featured,
  availableCountries: c.data.availableCountries
}));
```

- [ ] **Step 5: Update the product mapping in `src/pages/catalog/[slug].astro`**

In `[slug].astro`, the file builds two `CatalogProduct`s — one for `p` (the current product) and one for each `related` product. Add `availableCountries: <source>.data.availableCountries` to both:

```ts
const p: CatalogProduct = {
  slug: entry.slug,
  name: entry.data.name, code: entry.data.code, category: entry.data.category, sectors: entry.data.sectors,
  material: entry.data.material, dnRange: entry.data.dnRange, pnRating: entry.data.pnRating, standards: entry.data.standards,
  imageUrls: entry.data.imageUrls, image: entry.data.image, blurb: entry.data.blurb, pressure: entry.data.pressure,
  sizeRange: entry.data.sizeRange, bim: entry.data.bim, datasheet: entry.data.datasheet,
  installation: entry.data.installation, specs: entry.data.specs, featured: entry.data.featured,
  availableCountries: entry.data.availableCountries
};
const related: CatalogProduct[] = all
  .filter(x => x.slug !== p.slug && (x.data.category === p.category || x.data.sectors.some(s => p.sectors.includes(s))))
  .slice(0, 4)
  .map(c => ({
    slug: c.slug, name: c.data.name, code: c.data.code, category: c.data.category, sectors: c.data.sectors,
    material: c.data.material, dnRange: c.data.dnRange, pnRating: c.data.pnRating, standards: c.data.standards,
    imageUrls: c.data.imageUrls, image: c.data.image, blurb: c.data.blurb, pressure: c.data.pressure,
    sizeRange: c.data.sizeRange, bim: c.data.bim, datasheet: c.data.datasheet, installation: c.data.installation,
    specs: c.data.specs, featured: c.data.featured,
    availableCountries: c.data.availableCountries
  }));
```

- [ ] **Step 6: Update the test factory in `tests/catalogFilterEngine.test.ts`**

Add a default `availableCountries` to the `product()` factory so existing tests still type-check and pass. Replace the factory:

```ts
const product = (overrides: Partial<CatalogProduct>): CatalogProduct => ({
  slug: 'x', name: 'X', category: 'valves', sectors: [], standards: [], imageUrls: [],
  image: '', blurb: '', pressure: '', sizeRange: '', bim: false, specs: [], featured: false,
  availableCountries: ['country-1', 'country-2', 'country-3'],
  ...overrides
});
```

(No other changes to that file in this task.)

- [ ] **Step 7: Update `tests/catalogIntegration.test.ts` demo data**

Add `availableCountries` to every entry in the `demo` array, using the spec §4.3 distribution. Replace the array:

```ts
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
```

(All existing test cases stay exactly as they were.)

- [ ] **Step 8: Run the full test suite and check**

Run: `npm run test`
Expected: PASS — including the new `catalogByCountry.test.ts`, `catalogCountry.test.ts`, and the existing tests with their updated factories.

Run: `npm run check`
Expected: PASS — Astro content schema accepts all 8 MDX files; TypeScript types are all consistent.

If `astro check` fails on a specific MDX file ("availableCountries: Required"), open that file and confirm Step 3 was applied correctly (correct spelling, valid country values, non-empty array).

- [ ] **Step 9: Commit**

```bash
git add src/scripts/catalog/types.ts src/content/config.ts src/content/products src/pages/catalog tests/catalogFilterEngine.test.ts tests/catalogIntegration.test.ts
git commit -m "feat(catalog): require availableCountries on every product"
```

---

## Task 5: Modal component markup and styles

**Files:**
- Create: `src/components/catalog/CountryModal.astro`
- Modify: `src/styles/catalog.css`
- Modify: `src/pages/catalog/index.astro` (render modal)
- Modify: `src/pages/catalog/[slug].astro` (render modal)

The modal markup ships now but is hidden and inert (no script wired yet — that's Task 6). This way Task 5 alone is a green build.

- [ ] **Step 1: Create `src/components/catalog/CountryModal.astro`**

```astro
---
import { COUNTRIES } from '~/scripts/catalog/types';
---
<div class="country-modal" data-country-modal hidden
     role="dialog" aria-modal="true" aria-labelledby="country-modal-title">
  <div class="country-modal__backdrop" aria-hidden="true"></div>
  <div class="country-modal__panel" role="document">
    <h2 id="country-modal-title" class="cat-display text-2xl">Select your country</h2>
    <p class="text-sm text-[var(--cat-ink-muted)] mt-2">Product availability varies by region.</p>
    <ul class="country-modal__choices mt-6 space-y-2">
      {COUNTRIES.map(c => (
        <li>
          <button type="button" data-country={c.id} class="cat-btn cat-btn--ghost country-modal__choice w-full justify-center">
            {c.label}
          </button>
        </li>
      ))}
    </ul>
    <noscript>
      <p class="text-sm text-[var(--cat-ink-muted)] mt-4">Please enable JavaScript to browse the catalog.</p>
    </noscript>
  </div>
</div>
```

- [ ] **Step 2: Append modal styles to `src/styles/catalog.css`**

Append at the bottom of the file:

```css
/* Country picker modal — see docs/superpowers/specs/2026-04-27-catalog-country-gate-design.md */
.country-modal {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.country-modal[hidden] { display: none; }
.country-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(10, 20, 16, 0.55);
}
.country-modal__panel {
  position: relative;
  background: var(--cat-surface-raised);
  color: var(--cat-ink);
  border: 1px solid var(--cat-hairline);
  border-radius: 6px;
  padding: 2rem 1.75rem;
  width: 100%;
  max-width: 28rem;
  box-shadow: 0 20px 60px rgba(10, 20, 16, 0.25);
  font-family: 'Inter Tight', system-ui, sans-serif;
}
.country-modal__choice {
  width: 100%;
  justify-content: center;
}
```

- [ ] **Step 3: Render the modal inside the catalog index page**

Edit `src/pages/catalog/index.astro`. Add the import after the existing component imports, and render the modal inside the `.catalog-scope` block (just before `<section class="page-x ...">`). The relevant region becomes:

```astro
import CatalogHero from '~/components/catalog/CatalogHero.astro';
import UtilityBar from '~/components/catalog/UtilityBar.astro';
import ProductGrid from '~/components/catalog/ProductGrid.astro';
import FilterRail from '~/components/catalog/FilterRail.astro';
import QuoteBasket from '~/components/catalog/QuoteBasket.astro';
import CountryModal from '~/components/catalog/CountryModal.astro';
```

```astro
<Base title="Catalog (preview) — Elysee Irrigation" description="B2B catalog preview. Filter by sector, category, size, pressure, standard.">
  <div class="catalog-scope" data-catalog-root>
    <CountryModal />
    <section class="page-x pt-24 pb-12">
      ...
```

- [ ] **Step 4: Render the modal inside the catalog detail page**

Edit `src/pages/catalog/[slug].astro` similarly:

```astro
import CountryModal from '~/components/catalog/CountryModal.astro';
```

```astro
<Base title={`${p.name} — Catalog — Elysee Irrigation`} description={p.blurb}>
  <div class="catalog-scope" data-catalog-detail>
    <CountryModal />
    <section class="page-x pt-24 pb-8">
      ...
```

- [ ] **Step 5: Build and check**

Run: `npm run check`
Expected: PASS.

Run: `npm run build`
Expected: PASS — the modal is in the static HTML but `hidden` so visually nothing changed.

- [ ] **Step 6: Commit**

```bash
git add src/components/catalog/CountryModal.astro src/styles/catalog.css src/pages/catalog/index.astro src/pages/catalog/[slug].astro
git commit -m "feat(catalog): country picker modal markup and styles"
```

---

## Task 6: Modal script with focus trap

**Files:**
- Create: `src/scripts/catalog/country-modal.ts`

Exports `openCountryModal(onPick)` and (for symmetry) `closeCountryModal()`. The function locates the modal in the DOM, removes `hidden`, locks body scroll, traps focus, wires the per-button click handlers, and calls `onPick` with the chosen country.

- [ ] **Step 1: Create `src/scripts/catalog/country-modal.ts`**

```ts
import type { Country } from './types';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

let activeKeydown: ((e: KeyboardEvent) => void) | null = null;
let priorBodyOverflow = '';
let priorlyFocused: Element | null = null;

export function openCountryModal(onPick: (country: Country) => void): void {
  const modal = document.querySelector<HTMLElement>('[data-country-modal]');
  if (!modal) return;

  priorlyFocused = document.activeElement;
  priorBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  modal.removeAttribute('hidden');

  const buttons = modal.querySelectorAll<HTMLButtonElement>('button[data-country]');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const c = btn.dataset.country as Country | undefined;
      if (!c) return;
      closeCountryModal();
      onPick(c);
    }, { once: true });
  });

  // Focus the first button.
  const first = modal.querySelector<HTMLElement>(FOCUSABLE);
  first?.focus();

  // Focus trap + block Escape.
  activeKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); return; }
    if (e.key !== 'Tab') return;
    const focusables = Array.from(modal.querySelectorAll<HTMLElement>(FOCUSABLE))
      .filter(el => !el.hasAttribute('disabled'));
    if (focusables.length === 0) return;
    const firstEl = focusables[0];
    const lastEl = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === firstEl) {
      e.preventDefault();
      lastEl.focus();
    } else if (!e.shiftKey && document.activeElement === lastEl) {
      e.preventDefault();
      firstEl.focus();
    }
  };
  document.addEventListener('keydown', activeKeydown, true);
}

export function closeCountryModal(): void {
  const modal = document.querySelector<HTMLElement>('[data-country-modal]');
  if (!modal) return;
  modal.setAttribute('hidden', '');
  document.body.style.overflow = priorBodyOverflow;
  if (activeKeydown) {
    document.removeEventListener('keydown', activeKeydown, true);
    activeKeydown = null;
  }
  if (priorlyFocused instanceof HTMLElement) priorlyFocused.focus();
  priorlyFocused = null;
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/scripts/catalog/country-modal.ts
git commit -m "feat(catalog): country modal show/hide with focus trap"
```

---

## Task 7: Wire catalog index page to gate on country pick

**Files:**
- Modify: `src/scripts/catalog/page-init.ts`
- Modify: `src/pages/catalog/index.astro`

`initCatalogPage` accepts a `country: Country` argument and applies `byCountry` once at the start. The boot script in `index.astro` reads the stored country, opens the modal if missing, and calls `initCatalogPage(picked)` after pick.

- [ ] **Step 1: Update `initCatalogPage` to accept a `country` argument**

In `src/scripts/catalog/page-init.ts`, change the imports and the function signature, then narrow `products` to `scoped` once at the start:

```ts
import type { CatalogProduct, Country, Filters, SortKey } from './types';
import { EMPTY_FILTERS } from './types';
import { applyFilters, byCountry, sortProducts } from './filter-engine';
import { encodeFilters, decodeFilters } from './url-state';
import { getBasket } from './basket-store';

export function initCatalogPage(country: Country) {
  const root = document.querySelector<HTMLElement>('[data-catalog-root]');
  if (!root) return;

  const productsJson = root.querySelector<HTMLElement>('[data-products-json]')?.textContent ?? '[]';
  const allProducts: CatalogProduct[] = JSON.parse(productsJson);
  const products: CatalogProduct[] = byCountry(allProducts, country);

  // ... the rest of the function body unchanged ...
```

The trick: rename the local `products` variable to `allProducts`, then re-assign `products = byCountry(allProducts, country)`. **Every reference to `products` further down in the function continues to work** because everything else (the search, filter, sort, render, count display) operates on `products`. The "of N products" count display will now read "of {country's count} products" which is the correct behavior per spec §7.1 (rail counts reflect scoped set).

Verify the function compiles by reading through it once: every occurrence of `products` after the new line should still be valid.

- [ ] **Step 2: Update `src/pages/catalog/index.astro` boot script**

Replace the existing `<script>` block at the bottom of the file with the gated boot:

```astro
<script>
  import { initCatalogPage } from '~/scripts/catalog/page-init';
  import { initBasketUi } from '~/scripts/catalog/basket-ui';
  import { readCountry, writeCountry } from '~/scripts/catalog/country';
  import { openCountryModal } from '~/scripts/catalog/country-modal';

  function go() {
    initBasketUi();
    const country = readCountry();
    if (country) {
      initCatalogPage(country);
      return;
    }
    openCountryModal((picked) => {
      writeCountry(picked);
      initCatalogPage(picked);
    });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', go); }
  else { go(); }
</script>
```

- [ ] **Step 3: Build and smoke-test in the dev server**

Run: `npm run dev`

In a fresh browser (or after clearing `localStorage` in DevTools):

1. Navigate to `http://localhost:4321/catalog` — the modal appears, blocking the page.
2. Confirm: pressing `Escape` does nothing; clicking the backdrop does nothing.
3. Click "Country 1" — modal closes, grid shows 5 products (epsilon, saddle-clamp, pvc-ball-valve, double-union-glued, coupling-repair).
4. Reload the page — modal does NOT appear, same 5 products shown.
5. In DevTools, run `localStorage.setItem('elysee.country', 'country-3')` and reload — grid shows 3 products (saddle-clamp, pvc-ball-valve, single-4-bolts).
6. Open the filter rail — the standard/material counts reflect only those 3.
7. Run `localStorage.removeItem('elysee.country')` and reload — modal returns.

If any of these fail, debug before moving on. (Most likely: spelling of `availableCountries` in MDX, or a missed reference in `page-init.ts`.)

- [ ] **Step 4: Run typecheck and tests**

Run: `npm run check`
Expected: PASS.

Run: `npm run test`
Expected: PASS — existing tests still green.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/catalog/page-init.ts src/pages/catalog/index.astro
git commit -m "feat(catalog): gate catalog index on country pick"
```

---

## Task 8: Wire catalog detail page with "not available" notice

**Files:**
- Modify: `src/scripts/catalog/page-init-detail.ts`
- Modify: `src/pages/catalog/[slug].astro`

The detail page is more nuanced: even when a slug isn't in the chosen country's set, we render the page (so deep links don't 404). We replace the quote/CTA region with a notice and pass the country-scoped list down.

- [ ] **Step 1: Mark the CTA region as the "availability gate" so the script can replace it**

In `src/pages/catalog/[slug].astro`, change the bottom CTA section to add a `data-availability-gate` attribute on its container (so the script knows which DOM region to swap):

```astro
<section data-availability-gate class="border-t border-[var(--cat-hairline)] mt-12 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
  <div>
    <h2 class="cat-display text-2xl">Need this in your project?</h2>
    <p class="text-xs text-[var(--cat-ink-muted)] mt-1">We respond within one business day.</p>
  </div>
  <div class="flex gap-3">
    <button data-add-to-quote data-slug={p.slug} data-name={p.name} data-code={p.code ?? ''} data-thumb={p.imageUrls[0] ?? p.image} class="cat-btn cat-btn--primary">Request a quote</button>
    <a href="/#contact" class="cat-btn cat-btn--ghost">Talk to engineering</a>
  </div>
</section>
```

Also expose the slug + the product's `availableCountries` to the script via data attributes on the catalog-detail root. Change the wrapper `<div>`:

```astro
<div class="catalog-scope" data-catalog-detail
     data-product-slug={p.slug}
     data-product-countries={p.availableCountries.join(',')}>
```

- [ ] **Step 2: Update `initDetailPage` to accept country and render the "not available" notice**

Replace the contents of `src/scripts/catalog/page-init-detail.ts` with:

```ts
import type { Country } from './types';
import { COUNTRIES } from './types';
import { getBasket } from './basket-store';

export function initDetailPage(country: Country) {
  const root = document.querySelector<HTMLElement>('[data-catalog-detail]');
  if (!root) return;

  const productCountriesAttr = root.dataset.productCountries ?? '';
  const productCountries = productCountriesAttr.split(',').filter(Boolean) as Country[];
  const available = productCountries.includes(country);

  if (!available) {
    const gate = root.querySelector<HTMLElement>('[data-availability-gate]');
    if (gate) {
      const label = COUNTRIES.find(c => c.id === country)?.label ?? country;
      gate.innerHTML = `
        <div>
          <h2 class="cat-display text-2xl">Not available in ${label}</h2>
          <p class="text-xs text-[var(--cat-ink-muted)] mt-1">This product is sold in other regions. Contact us for cross-region availability.</p>
        </div>
        <div class="flex gap-3">
          <a href="/catalog" class="cat-btn cat-btn--ghost">Back to catalog</a>
          <a href="/#contact" class="cat-btn cat-btn--primary">Talk to engineering</a>
        </div>
      `;
    }
  }

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

  // Add to quote — only wire when available; if not available, the gate region was replaced and there's no quote button.
  const basket = getBasket();
  function refreshAddButtons() {
    const items = basket.getItems();
    root!.querySelectorAll<HTMLButtonElement>('[data-add-to-quote]').forEach(btn => {
      const inBasket = items.find(i => i.slug === btn.dataset.slug);
      if (inBasket) {
        btn.textContent = `In quote (${inBasket.qty}) ✓`;
      } else {
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

- [ ] **Step 3: Update the boot script in `src/pages/catalog/[slug].astro`**

Replace the existing `<script>` block with the country-gated version:

```astro
<script>
  import { initDetailPage } from '~/scripts/catalog/page-init-detail';
  import { initBasketUi } from '~/scripts/catalog/basket-ui';
  import { readCountry, writeCountry } from '~/scripts/catalog/country';
  import { openCountryModal } from '~/scripts/catalog/country-modal';

  function go() {
    initBasketUi();
    const country = readCountry();
    if (country) {
      initDetailPage(country);
      return;
    }
    openCountryModal((picked) => {
      writeCountry(picked);
      initDetailPage(picked);
    });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', go); }
  else { go(); }
</script>
```

- [ ] **Step 4: Smoke-test the detail page**

Run: `npm run dev`

1. Clear `localStorage` and visit `http://localhost:4321/catalog/epsilon` — modal appears.
2. Pick "Country 1" — page renders normally with the quote CTA visible (epsilon is available in country-1).
3. Set `localStorage.setItem('elysee.country', 'country-3')` and reload — page renders, but the bottom region now reads "Not available in Country 3" with a "Back to catalog" link instead of the quote button.
4. Visit `/catalog/saddle-clamp` (which IS in country-3) and confirm the CTA is back.

- [ ] **Step 5: Run typecheck and tests**

Run: `npm run check && npm run test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/scripts/catalog/page-init-detail.ts src/pages/catalog/[slug].astro
git commit -m "feat(catalog): gate detail page on country, show not-available notice"
```

---

## Task 9: Extend integration test with country-3 case

**Files:**
- Modify: `tests/catalogIntegration.test.ts`

- [ ] **Step 1: Append a new `it` block to the existing `describe('catalog integration', () => { ... })`**

Add the import for `byCountry` at the top of the file (next to `applyFilters, sortProducts`):

```ts
import { applyFilters, byCountry, sortProducts } from '~/scripts/catalog/filter-engine';
import { deriveFacets } from '~/scripts/catalog/derive-facets';
```

Then add two new test cases inside the `describe` block (before the closing `});`):

```ts
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
```

- [ ] **Step 2: Run the test file**

Run: `npx vitest run tests/catalogIntegration.test.ts`
Expected: PASS — all original cases plus the two new ones.

- [ ] **Step 3: Run the full test suite**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add tests/catalogIntegration.test.ts
git commit -m "test(catalog): integration coverage for country-3 scoping"
```

---

## Task 10: Final verification against acceptance criteria

**Files:** none modified — this is a verification step.

- [ ] **Step 1: Full check + test run**

Run: `npm run check && npm run test`
Expected: both PASS.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: PASS — static output in `dist/`.

- [ ] **Step 3: Walk through acceptance criteria from the spec**

For each item below, manually verify in `npm run dev`:

- [ ] First visit to `/catalog` shows modal, page is not interactive.
- [ ] Modal cannot be dismissed without picking (no close button, click-outside, Escape).
- [ ] After pick, grid shows only that country's products and rail counts reflect the subset.
- [ ] Reload: modal does not reappear; same products shown.
- [ ] `localStorage.removeItem('elysee.country')` + reload: modal reappears.
- [ ] Setting `localStorage.elysee.country` to a different valid value + reload: grid reflects new country.
- [ ] Setting an invalid value (e.g., `'foo'`) + reload: modal reappears.
- [ ] Deep-linking to `/catalog/coupling-repair` while in country-3 (where it's not available) renders the page with "Not available in Country 3" notice instead of quote CTA.
- [ ] Deep-linking to `/catalog/saddle-clamp` while in country-3 shows the quote CTA normally.
- [ ] `/products` and `/products/epsilon` show ALL 8 products and no modal appears.

If any fails, fix it now and recommit before declaring complete.

- [ ] **Step 4: Optional — clean any final fixes into one commit**

If you needed a final tweak from Step 3, commit it as `fix(catalog): post-review cleanup` (or similar).

---

## Self-review checklist

**Spec coverage:**
- §1 Background — informational, no task needed.
- §2.1 In scope — Tasks 1–9 cover all items.
- §3 User flow — Task 7 (index) + Task 8 (detail) implement the flow.
- §4.1 Country type — Task 1.
- §4.2 Schema additions — Task 4.
- §4.3 Demo distribution — Task 4 Step 3.
- §5 Modal component — Task 5.
- §6 Storage module — Task 2.
- §7 Filter pipeline — Task 3 (helper) + Task 7 (integration).
- §8 Page-level wiring — Task 7 (index) + Task 8 (detail).
- §9 Edge cases — Task 7 (modal flow), Task 8 (deep-link not-available), Task 2 (storage throws). Build-time MDX check covered by `npm run check` in Task 4.
- §10 Testing — Tasks 2 (`catalogCountry.test.ts`), 3 (`catalogByCountry.test.ts`), 9 (integration extension).
- §11 Files changed — every file listed in the spec maps to one or more tasks above.
- §12 Acceptance criteria — Task 10.

**Placeholder scan:** No "TBD" / "TODO" / "fill in" / "add error handling" patterns. Every code step has complete code.

**Type consistency:** `Country`, `COUNTRIES`, `availableCountries`, `byCountry`, `readCountry`, `writeCountry`, `openCountryModal`, `closeCountryModal`, `initCatalogPage(country)`, `initDetailPage(country)` — names are consistent across all tasks.

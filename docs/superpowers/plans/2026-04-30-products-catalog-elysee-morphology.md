# Products & Catalog Elysee Morphology Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `/products` and `/catalog` to mirror elysee.com.cy's category-grid + per-category-listing morphology, while preserving the existing country gate, filter rail, and quote basket as enhancements.

**Architecture:** Replace the cinematic `/products` showcase with a 13-card category brochure. Replace the flat `/catalog` with nested `/catalog/<category>` listings and `/catalog/<category>/<product>` detail pages. Add a `categories` content collection. Rename `category` → `categorySlug` on every product. Filter category out of the user-facing facet rail (it's now URL-driven). Keep TDD discipline on data-layer changes; rely on manual smoke for layout work.

**Tech Stack:** Astro 5 · Tailwind v4 · MDX · Vitest · TypeScript · vanilla DOM.

**Spec:** `docs/superpowers/specs/2026-04-30-products-catalog-elysee-morphology-design.md`

---

## File overview

**New:**
- `src/content/categories/<slug>.mdx` (× 13)
- `public/images/categories/<slug>.png` (× 13, fetched)
- `public/images/categories/placeholder.svg` (1, manual)
- `src/components/products/CategoryCard.astro`
- `src/components/catalog/CategoriesNav.astro`
- `src/pages/catalog/[category]/index.astro`
- `src/pages/catalog/[category]/[product].astro`
- `scripts/categories/fetch-images.ts`
- `tests/catalogByCategory.test.ts`
- `tests/categoriesContent.test.ts`

**Modified:**
- `src/scripts/catalog/types.ts`
- `src/content/config.ts`
- `src/scripts/catalog/filter-engine.ts`
- `src/scripts/catalog/derive-facets.ts`
- `src/scripts/catalog/page-init.ts`
- `src/scripts/catalog/page-init-detail.ts`
- `src/components/catalog/FilterRail.astro`
- `src/components/catalog/ProductCard.astro`
- `src/components/catalog/RelatedProducts.astro`
- `src/components/sections/EpsilonCameo.astro` (link redirect only)
- `src/pages/products/index.astro` (full rewrite)
- 8 product MDX files in `src/content/products/`
- `astro.config.mjs` (add redirects)
- 4 existing test files (factory rename)

**Deleted:**
- `src/pages/products/epsilon.astro`
- `src/pages/catalog/index.astro`
- `src/pages/catalog/[slug].astro`
- `src/components/products/EpsilonStage.astro`
- `src/components/products/ProductCard.astro` (orphan after `/products` rewrite — different from catalog/ProductCard.astro)
- `src/components/products/FilterRail.astro` (orphan)
- `src/scripts/motion/timelines/epsilonPage.ts`
- `src/scripts/motion/timelines/productsFilter.ts`

**Kept (despite being mentioned in the spec's deletion list — spec correction):**
- `src/components/sections/EpsilonCameo.astro` — still used by the homepage (`src/pages/index.astro`); only the link target inside it is updated.
- `src/scripts/motion/timelines/epsilonCameo.ts` — still imported by EpsilonCameo.astro.

---

## Task 1: Add CategorySlug type and CATEGORY_SLUGS constant

**Files:**
- Modify: `src/scripts/catalog/types.ts`

No consumers in this task; it's just a type/constant addition. `CatalogProduct.category` stays in place for now (replaced atomically in Task 3 along with the schema migration).

- [ ] **Step 1: Add the type and constant**

In `src/scripts/catalog/types.ts`, after the `Country` type and `COUNTRIES` constant (around line 11), insert:

```ts
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
```

- [ ] **Step 2: Run typecheck**

Run: `npm run check`
Expected: PASS — 0 errors. (No consumers yet.)

- [ ] **Step 3: Commit**

```bash
git add src/scripts/catalog/types.ts
git commit -m "feat(catalog): add CategorySlug type and CATEGORY_SLUGS constant"
```

---

## Task 2: byCategory filter helper with TDD

**Files:**
- Modify: `src/scripts/catalog/filter-engine.ts`
- Test: `tests/catalogByCategory.test.ts`

This task introduces `byCategory` and tests it against the new `categorySlug` field. The existing `CatalogProduct` interface still has `category` (not `categorySlug`) until Task 3, so the test factory uses an `as any` cast to inject `categorySlug` synthetically — Task 3 immediately follows and resolves the type.

- [ ] **Step 1: Write the failing test**

Create `tests/catalogByCategory.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { byCategory } from '~/scripts/catalog/filter-engine';
import type { CatalogProduct, CategorySlug } from '~/scripts/catalog/types';

const make = (slug: string, categorySlug: CategorySlug): CatalogProduct => ({
  slug,
  name: slug,
  category: 'valves' as any, // legacy field — removed in Task 3
  categorySlug,
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
  availableCountries: ['country-1', 'country-2', 'country-3'],
} as unknown as CatalogProduct);

describe('byCategory', () => {
  const products: CatalogProduct[] = [
    make('a', 'compression-fittings'),
    make('b', 'compression-fittings'),
    make('c', 'valves'),
    make('d', 'saddles'),
  ];

  it('returns only products in the given category', () => {
    expect(byCategory(products, 'compression-fittings').map(p => p.slug)).toEqual(['a', 'b']);
    expect(byCategory(products, 'valves').map(p => p.slug)).toEqual(['c']);
    expect(byCategory(products, 'saddles').map(p => p.slug)).toEqual(['d']);
  });

  it('returns empty array when no products in category', () => {
    expect(byCategory(products, 'turf')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/catalogByCategory.test.ts`
Expected: FAIL — `byCategory` not exported.

- [ ] **Step 3: Add `byCategory` to filter-engine.ts**

In `src/scripts/catalog/filter-engine.ts`, change the imports at the top:

```ts
import type { CatalogProduct, CategorySlug, Country, Filters, SortKey } from './types';
import { search } from './mini-search';
```

Add the helper after the existing `byCountry`:

```ts
export function byCategory(products: CatalogProduct[], category: CategorySlug): CatalogProduct[] {
  return products.filter(p => p.categorySlug === category);
}
```

(Leave `applyFilters`, `sortProducts`, and `byCountry` as they are.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/catalogByCategory.test.ts`
Expected: PASS — both cases. There may be a TS error on `p.categorySlug` because `CatalogProduct` does not yet have the field — Vitest still runs in spite of TS errors. Task 3 resolves it.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/catalog/filter-engine.ts tests/catalogByCategory.test.ts
git commit -m "feat(catalog): add byCategory filter helper"
```

---

## Task 3: Schema migration — category → categorySlug

**Files:**
- Modify: `src/scripts/catalog/types.ts`
- Modify: `src/content/config.ts`
- Modify: `src/scripts/catalog/filter-engine.ts`
- Modify: `src/scripts/catalog/derive-facets.ts`
- Modify: `src/components/catalog/FilterRail.astro`
- Modify: `src/scripts/catalog/page-init.ts` (chips/render references)
- Modify: 8 MDX files in `src/content/products/`
- Modify: `tests/catalogFilterEngine.test.ts`
- Modify: `tests/catalogIntegration.test.ts`
- Modify: `tests/catalogDeriveFacets.test.ts`
- Modify: `tests/catalogMiniSearch.test.ts`
- Modify: `tests/catalogByCountry.test.ts`
- Modify: `tests/catalogByCategory.test.ts` (drop the `as any` cast)

This is a large atomic commit. Group everything because the type rename + zod schema change must move together with the MDX content updates and the test factories — leaving any one out fails `npm run check` or the test run.

- [ ] **Step 1: Update `CatalogProduct` interface**

In `src/scripts/catalog/types.ts`:
- Remove the line `export type Category = 'compression-fittings' | 'pvc-ball-valves' | 'saddles' | 'adaptor-flanged' | 'couplings' | 'valves';`
- In `interface CatalogProduct`, replace `category: Category;` with `categorySlug: CategorySlug;`
- In `interface Filters`, remove the line `categories: Category[];`
- In the `EMPTY_FILTERS` constant, remove the `categories: [],` line.

- [ ] **Step 2: Update zod schema in `src/content/config.ts`**

In the products `defineCollection` schema:
- Remove the line `category: z.enum(['compression-fittings', 'pvc-ball-valves', 'saddles', 'adaptor-flanged', 'couplings', 'valves']),`
- Add: `categorySlug: z.enum(['compression-fittings', 'hydraulic-fittings', 'saddles', 'light-weight-fittings', 'valves', 'filters-and-dosers', 'micro-irrigation-and-sprinklers', 'turf', 'polyethylene-pipes', 'pvc-pressure-pipes-and-fittings', 'network-drainage', 'cable-applications', 'building-sewerage']),`

(Keep all other fields unchanged.)

- [ ] **Step 3: Drop categories from `applyFilters` and `deriveFacets`**

In `src/scripts/catalog/filter-engine.ts`, inside `applyFilters`, remove the line:
```ts
if (f.categories.length) out = out.filter(p => f.categories.includes(p.category));
```

In `src/scripts/catalog/derive-facets.ts`:
- Remove `categories: FacetCount<Category>[];` from `interface DerivedFacets`.
- Remove the `Category` import (was: `import type { CatalogProduct, Sector, Category } from './types';` → `import type { CatalogProduct, Sector } from './types';`).
- In `deriveFacets`, remove the line `categories: tally(products.map(p => [p.category])),`.

- [ ] **Step 4: Drop the Category facet group from FilterRail.astro**

In `src/components/catalog/FilterRail.astro`, remove the line:
```astro
<FilterGroup title="Category" facetKey="categories" options={facets.categories} defaultOpen />
```

(The Sector / Material / Standards / DN / PN / Other groups stay.)

- [ ] **Step 5: Drop categories handling from `page-init.ts`**

In `src/scripts/catalog/page-init.ts`:
- In `renderActiveChips`, remove the line `filters.categories.forEach(c => chips.push(chip('categories', c, chipLabel(c))));`
- In `activeCount`, change `filters.sectors.length + filters.categories.length + filters.materials.length + filters.standards.length` to `filters.sectors.length + filters.materials.length + filters.standards.length`.

- [ ] **Step 6: Update all 8 product MDX files**

For each file, replace the existing `category: <value>` line in the frontmatter with `categorySlug: <new-value>`:

| File | Old line | New line |
|---|---|---|
| `epsilon.mdx` | `category: compression-fittings` | `categorySlug: compression-fittings` |
| `coupling-repair.mdx` | `category: couplings` | `categorySlug: compression-fittings` |
| `coupling-transition.mdx` | `category: couplings` | `categorySlug: compression-fittings` |
| `adaptor-flanged.mdx` | `category: adaptor-flanged` | `categorySlug: hydraulic-fittings` |
| `single-4-bolts.mdx` | `category: adaptor-flanged` | `categorySlug: hydraulic-fittings` |
| `saddle-clamp.mdx` | `category: saddles` | `categorySlug: saddles` |
| `pvc-ball-valve.mdx` | `category: pvc-ball-valves` | `categorySlug: valves` |
| `double-union-glued.mdx` | `category: valves` | `categorySlug: valves` |

- [ ] **Step 7: Update test factories**

In each of the following test files, the `product()` factory or inline test fixture has `category: <value>` — rename to `categorySlug: <value>`. Change the value where needed to match the new enum:

`tests/catalogFilterEngine.test.ts` factory: replace `category: 'valves'` with `categorySlug: 'valves'`. Inside test cases that pass `categories: ['valves']` to `EMPTY_FILTERS`, those tests now exercise a removed feature — DELETE the cases:
- `it('filters by category', ...)` — DELETE
- `it('AND across facets', ...)` — UPDATE: instead of testing sector + category, test sector + material:
  ```ts
  it('AND across facets', () => {
    expect(applyFilters(ps, { ...EMPTY_FILTERS, sectors: ['agriculture'], materials: ['PVC-U'] }).map(p => p.slug)).toEqual(['a']);
  });
  ```

`tests/catalogIntegration.test.ts` demo array: each entry has `category: '...'` — rename and remap per the table in Step 6:
- epsilon: `categorySlug: 'compression-fittings'`
- adaptor-flanged: `categorySlug: 'hydraulic-fittings'`
- coupling-repair: `categorySlug: 'compression-fittings'`
- coupling-transition: `categorySlug: 'compression-fittings'`
- single-4-bolts: `categorySlug: 'hydraulic-fittings'`
- double-union-glued: `categorySlug: 'valves'`
- pvc-ball-valve: `categorySlug: 'valves'`
- saddle-clamp: `categorySlug: 'saddles'`

`tests/catalogDeriveFacets.test.ts` factory: rename `category` → `categorySlug`. Delete any test case asserting on `f.categories` (the field no longer exists).

`tests/catalogMiniSearch.test.ts` factory: rename `category` → `categorySlug`.

`tests/catalogByCountry.test.ts` factory: rename `category` → `categorySlug`.

`tests/catalogByCategory.test.ts`: simplify the factory now that `categorySlug` is on the type. Replace the factory:

```ts
const make = (slug: string, categorySlug: CategorySlug): CatalogProduct => ({
  slug,
  name: slug,
  categorySlug,
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
  availableCountries: ['country-1', 'country-2', 'country-3'],
});
```

(Drop the `category: 'valves' as any` line and the `as unknown as CatalogProduct` cast.)

- [ ] **Step 8: Verify**

Run: `npm run test`
Expected: PASS — all tests including the new `catalogByCategory.test.ts` and the renamed `catalogIntegration` cases.

Run: `npm run check`
Expected: PASS — 0 errors.

If a content schema error fires (e.g., "categorySlug: Required"), check that all 8 MDX files have the line and the value matches one of the 13 enum entries.

- [ ] **Step 9: Commit**

```bash
git add src/scripts/catalog/types.ts src/content/config.ts src/scripts/catalog/filter-engine.ts src/scripts/catalog/derive-facets.ts src/components/catalog/FilterRail.astro src/scripts/catalog/page-init.ts src/content/products tests/
git commit -m "refactor(catalog): rename category to categorySlug, drop user-facing categories facet"
```

---

## Task 4: Add `categories` content collection + 13 MDX files

**Files:**
- Modify: `src/content/config.ts`
- Create: `src/content/categories/<slug>.mdx` (× 13)
- Create: `public/images/categories/placeholder.svg`

The MDX files all reference `/images/categories/<slug>.png` — those PNGs are added in Task 6. Until then, the rendered `/products` page (Task 11) will show broken images. That's fine; we ship the images before we render.

- [ ] **Step 1: Add the `categories` collection schema**

In `src/content/config.ts`, after the existing `products` collection, before `sectors`, add:

```ts
const categories = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    order: z.number().int().nonnegative(),
    image: z.string(),
    sourceImage: z.string().url().optional(),
    leafletPdf: z.string().optional(),
    blurb: z.string()
  })
});
```

In the `export const collections = ...` line at the bottom, add `categories`:

```ts
export const collections = { products, sectors, insights, categories };
```

- [ ] **Step 2: Create the 13 category MDX files**

Create `src/content/categories/compression-fittings.mdx`:

```mdx
---
name: Compression Fittings
slug: compression-fittings
order: 0
image: /images/categories/compression-fittings.png
sourceImage: https://elysee.com.cy/portal-img/default/246/category-a-compression-fittings.png
blurb: Quick-fit re-usable fittings for PE pipes — Epsilon, Lambda, Zeta, Omicron, Eta series.
---
```

Create `src/content/categories/hydraulic-fittings.mdx`:

```mdx
---
name: Hydraulic Fittings
slug: hydraulic-fittings
order: 1
image: /images/categories/hydraulic-fittings.png
sourceImage: https://elysee.com.cy/portal-img/default/246/category-b-hydraulic-fittings.png
blurb: Flanged adaptors and high-pressure connectors for PE mains and metallic infrastructure.
---
```

Create `src/content/categories/saddles.mdx`:

```mdx
---
name: Saddles
slug: saddles
order: 2
image: /images/categories/saddles.png
sourceImage: https://elysee.com.cy/portal-img/default/246/category-c-saddles.png
blurb: Tapping saddles for PE mains — fast branch connections without cutting the line.
---
```

Create `src/content/categories/light-weight-fittings.mdx`:

```mdx
---
name: Light-Weight Fittings
slug: light-weight-fittings
order: 3
image: /images/categories/light-weight-fittings.png
sourceImage: https://elysee.com.cy/portal-img/default/246/category-d-light-weight-fittings.png
blurb: Compact fittings for low-pressure irrigation and drainage runs.
---
```

Create `src/content/categories/valves.mdx`:

```mdx
---
name: Valves
slug: valves
order: 4
image: /images/categories/valves.png
sourceImage: https://elysee.com.cy/portal-img/default/246/category-e-valves.png
blurb: PVC ball valves, double-union valves, gate valves for water and chemical lines.
---
```

Create `src/content/categories/filters-and-dosers.mdx`:

```mdx
---
name: Filters & Dosers
slug: filters-and-dosers
order: 5
image: /images/categories/filters-and-dosers.png
sourceImage: https://elysee.com.cy/portal-img/default/246/category-f-filters-dosers.png
blurb: Disc and screen filters, fertigation dosers for irrigation networks.
---
```

Create `src/content/categories/micro-irrigation-and-sprinklers.mdx`:

```mdx
---
name: Micro-Irrigation & Sprinklers
slug: micro-irrigation-and-sprinklers
order: 6
image: /images/categories/micro-irrigation-and-sprinklers.png
sourceImage: https://elysee.com.cy/portal-img/default/246/category-g-micro-irrigation-sprinklers.png
blurb: Drippers, micro-sprinklers, and emitters for precision agriculture and landscape.
---
```

Create `src/content/categories/turf.mdx`:

```mdx
---
name: Turf
slug: turf
order: 7
image: /images/categories/turf.png
sourceImage: https://elysee.com.cy/portal-img/default/246/category-h-turf.png
blurb: Pop-up sprinklers and turf irrigation systems for sports fields and landscapes.
---
```

Create `src/content/categories/polyethylene-pipes.mdx`:

```mdx
---
name: Polyethylene Pipes
slug: polyethylene-pipes
order: 8
image: /images/categories/polyethylene-pipes.png
sourceImage: https://elysee.com.cy/portal-img/default/246/category-i-polyethylene-pipes.png
blurb: PE pipes for water mains, gas distribution, and industrial fluid transport.
---
```

Create `src/content/categories/pvc-pressure-pipes-and-fittings.mdx`:

```mdx
---
name: PVC Pressure Pipes & Fittings
slug: pvc-pressure-pipes-and-fittings
order: 9
image: /images/categories/pvc-pressure-pipes-and-fittings.png
sourceImage: https://elysee.com.cy/portal-img/default/246/category-j-pvc-pressure-pipes-fittings.png
blurb: PVC pressure pipes and solvent-weld fittings for water supply and chemical lines.
---
```

Create `src/content/categories/network-drainage.mdx`:

```mdx
---
name: Network Drainage
slug: network-drainage
order: 10
image: /images/categories/network-drainage.png
sourceImage: https://elysee.com.cy/portal-img/default/246/category-k-network-drainage.png
blurb: Drainage pipes and fittings for stormwater and surface runoff networks.
---
```

Create `src/content/categories/cable-applications.mdx`:

```mdx
---
name: Cable Applications
slug: cable-applications
order: 11
image: /images/categories/cable-applications.png
sourceImage: https://elysee.com.cy/portal-img/default/246/category-l-cable-applications.png
blurb: Cable conduit and protection systems for buried utility runs.
---
```

Create `src/content/categories/building-sewerage.mdx`:

```mdx
---
name: Building Sewerage
slug: building-sewerage
order: 12
image: /images/categories/building-sewerage.png
sourceImage: https://elysee.com.cy/portal-img/default/246/category-m-building-sewerage.png
blurb: Soil and waste pipe systems for residential and commercial buildings.
---
```

- [ ] **Step 3: Add the placeholder SVG**

Create `public/images/categories/placeholder.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <rect width="400" height="300" fill="#ece5d4"/>
  <text x="200" y="160" font-family="system-ui, sans-serif" font-size="20" fill="#52635a" text-anchor="middle">Image coming soon</text>
</svg>
```

This is the manual fallback used by the developer if a category's PNG is missing.

- [ ] **Step 4: Verify**

Run: `npm run check`
Expected: PASS — Astro reads the categories collection without error.

- [ ] **Step 5: Commit**

```bash
git add src/content/config.ts src/content/categories public/images/categories/placeholder.svg
git commit -m "feat(catalog): add categories content collection with 13 entries"
```

---

## Task 5: Image fetch script

**Files:**
- Create: `scripts/categories/fetch-images.ts`

The script reads each category MDX, fetches its `sourceImage` URL, and writes the result to `public/images/categories/<slug>.png`. One-time setup; not part of the build.

- [ ] **Step 1: Create the script**

Create `scripts/categories/fetch-images.ts`:

```ts
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src', 'content', 'categories');
const OUT = join(ROOT, 'public', 'images', 'categories');

interface Frontmatter { slug?: string; sourceImage?: string; image?: string; }

function parseFrontmatter(content: string): Frontmatter {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm: Frontmatter = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    (fm as any)[kv[1]] = kv[2].trim();
  }
  return fm;
}

async function fetchOne(slug: string, url: string): Promise<{ slug: string; ok: boolean; reason?: string }> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'elysee-fetch-images/1.0' } });
    if (!res.ok) return { slug, ok: false, reason: `HTTP ${res.status}` };
    const buf = Buffer.from(await res.arrayBuffer());
    if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
    writeFileSync(join(OUT, `${slug}.png`), buf);
    return { slug, ok: true };
  } catch (e) {
    return { slug, ok: false, reason: String(e) };
  }
}

async function main() {
  const files = readdirSync(SRC).filter(f => f.endsWith('.mdx'));
  const tasks: Promise<{ slug: string; ok: boolean; reason?: string }>[] = [];
  for (const f of files) {
    const fm = parseFrontmatter(readFileSync(join(SRC, f), 'utf-8'));
    if (!fm.slug || !fm.sourceImage) {
      console.warn(`Skipping ${f}: missing slug or sourceImage`);
      continue;
    }
    tasks.push(fetchOne(fm.slug, fm.sourceImage));
  }
  const results = await Promise.all(tasks);
  const ok = results.filter(r => r.ok).length;
  const fail = results.filter(r => !r.ok);
  console.log(`Fetched ${ok}/${results.length} category images.`);
  for (const f of fail) console.error(`FAILED ${f.slug}: ${f.reason}`);
  process.exit(fail.length ? 1 : 0);
}

main();
```

- [ ] **Step 2: Verify it parses**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add scripts/categories/fetch-images.ts
git commit -m "feat(catalog): one-time script to fetch category images"
```

---

## Task 6: Run image fetch and commit PNGs

**Files:**
- Create: `public/images/categories/<slug>.png` (× 13)

- [ ] **Step 1: Run the fetch**

Run: `npx tsx scripts/categories/fetch-images.ts`
Expected: `Fetched 13/13 category images.` Or partial — if some URLs return 404, accept that and use the placeholder for missing slugs (manually copy `public/images/categories/placeholder.svg` to `<slug>.png` and update the MDX `image` field if needed).

If `tsx` is not installed: `npm i -D tsx` (one-time), then re-run.

- [ ] **Step 2: Verify the files**

Run: `ls -la public/images/categories/`
Expected: at minimum `placeholder.svg`. Ideally 13 `.png` files alongside.

For any slug whose PNG was not fetched, edit `src/content/categories/<slug>.mdx` and change `image: /images/categories/<slug>.png` to `image: /images/categories/placeholder.svg`. Do NOT remove `sourceImage` (so a later re-run can try again).

- [ ] **Step 3: Commit**

```bash
git add public/images/categories src/content/categories
git commit -m "feat(catalog): commit fetched category images"
```

---

## Task 7: Strip 3 stat chips from ProductCard.astro

**Files:**
- Modify: `src/components/catalog/ProductCard.astro`

Elysee's product cards show only image + code + name + "View details →". Our cards have additional PN/DN/material chips that don't match.

- [ ] **Step 1: Edit the component**

Replace the contents of `src/components/catalog/ProductCard.astro` with:

```astro
---
import type { CatalogProduct } from '~/scripts/catalog/types';
interface Props { product: CatalogProduct; }
const { product: p } = Astro.props;
const thumb = p.imageUrls[0] ?? p.image;
const detailUrl = `/catalog/${p.categorySlug}/${p.slug}`;
---
<article class="cat-card overflow-hidden flex flex-col" data-product-card data-slug={p.slug}>
  <a href={detailUrl} class="block aspect-square bg-white">
    <img src={thumb} alt={p.name} loading="lazy" width="320" height="320" class="w-full h-full object-contain p-4" />
  </a>
  <div class="p-4 flex flex-col gap-2 flex-1">
    {p.code && <p class="cat-mono text-[11px] text-[var(--cat-ink-subtle)]">{p.code}</p>}
    <a href={detailUrl} class="cat-display text-[22px] leading-tight hover:text-[var(--cat-accent)]">{p.name}</a>
    <p class="text-xs text-[var(--cat-ink-muted)] line-clamp-2">{p.blurb}</p>
    <div class="flex items-center justify-between mt-auto pt-3">
      <button data-add-to-quote data-slug={p.slug} data-name={p.name} data-code={p.code ?? ''} data-thumb={thumb} class="cat-btn cat-btn--ghost">Add to quote</button>
      <a href={detailUrl} class="cat-mono text-[11px] text-[var(--cat-accent)] hover:text-[var(--cat-accent-bright)]">View →</a>
    </div>
  </div>
</article>
```

Changes from the previous version:
- The 3 chips (`pnRating`, `dnRange`, material) are removed.
- The `formatDN`/`formatPN` imports are removed.
- The product detail href changes from `/catalog/${p.slug}` to `/catalog/${p.categorySlug}/${p.slug}` (matches the new nested route).

- [ ] **Step 2: Verify**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/catalog/ProductCard.astro
git commit -m "refactor(catalog): simplify ProductCard to elysee morphology, update detail href"
```

---

## Task 8: Tighten RelatedProducts to same categorySlug

**Files:**
- Modify: `src/components/catalog/RelatedProducts.astro` (no actual change needed — the component takes a `products` array)
- Modify: `src/pages/catalog/[category]/[product].astro` (in Task 13 — narrowing happens at the call site)

The component itself just renders whatever `products` it receives. Tightening to the same `categorySlug` happens at the call site in Task 13. **No change to RelatedProducts.astro itself in this task — it's already correctly factored.** Skip this as a no-op task or fold into Task 13.

(This task can be skipped — moving the responsibility into Task 13 keeps the change atomic with the page rewrite.)

---

## Task 9: New CategoriesNav.astro component

**Files:**
- Create: `src/components/catalog/CategoriesNav.astro`

Renders the 13 categories as a vertical link list inside the `/catalog/<category>` sidebar. The active category is highlighted via `aria-current="page"` and a CSS rule.

- [ ] **Step 1: Create the component**

Create `src/components/catalog/CategoriesNav.astro`:

```astro
---
import { getCollection } from 'astro:content';
interface Props { active: string; }
const { active } = Astro.props;
const categories = (await getCollection('categories')).sort((a, b) => a.data.order - b.data.order);
---
<nav aria-label="Categories" class="categories-nav">
  <h3 class="cat-mono text-[11px] uppercase tracking-wider text-[var(--cat-ink-muted)] mb-2">Categories</h3>
  <ul class="flex flex-col gap-0.5">
    {categories.map(c => (
      <li>
        <a
          href={`/catalog/${c.data.slug}`}
          aria-current={c.data.slug === active ? 'page' : undefined}
          class:list={[
            'block py-1.5 px-2 text-xs leading-tight rounded',
            c.data.slug === active
              ? 'bg-[var(--cat-surface-sunken)] text-[var(--cat-accent)] font-semibold border-l-2 border-[var(--cat-accent)]'
              : 'text-[var(--cat-ink-muted)] hover:text-[var(--cat-accent)] hover:bg-[var(--cat-surface-sunken)] border-l-2 border-transparent'
          ]}
        >
          {c.data.name}
        </a>
      </li>
    ))}
  </ul>
</nav>
```

- [ ] **Step 2: Verify**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/catalog/CategoriesNav.astro
git commit -m "feat(catalog): CategoriesNav component for catalog sidebar"
```

---

## Task 10: New CategoryCard.astro component

**Files:**
- Create: `src/components/products/CategoryCard.astro`

The card on `/products`. Whole card is clickable; an inner PDF link uses `stopPropagation` so it doesn't follow the parent.

- [ ] **Step 1: Create the component**

Create `src/components/products/CategoryCard.astro`:

```astro
---
interface Props {
  name: string;
  slug: string;
  image: string;
  blurb: string;
  leafletPdf?: string;
}
const { name, slug, image, blurb, leafletPdf } = Astro.props;
---
<a href={`/catalog/${slug}`} class="category-card block group">
  <div class="aspect-[4/3] bg-[var(--cat-surface-raised)] overflow-hidden border border-[var(--cat-hairline)]">
    <img
      src={image}
      alt={name}
      loading="lazy"
      class="w-full h-full object-contain p-6 group-hover:scale-[1.02] transition-transform duration-300"
    />
  </div>
  <div class="mt-3">
    <h3 class="cat-display text-xl group-hover:text-[var(--cat-accent)]">{name}</h3>
    <p class="text-sm text-[var(--cat-ink-muted)] mt-1 line-clamp-2">{blurb}</p>
    <div class="flex items-center justify-between mt-3">
      <span class="cat-mono text-[11px] text-[var(--cat-accent)]">View products →</span>
      {leafletPdf && (
        <a
          href={leafletPdf}
          download
          onclick="event.stopPropagation()"
          class="cat-mono text-[11px] text-[var(--cat-ink-muted)] hover:text-[var(--cat-accent)] inline-flex items-center gap-1"
          aria-label={`Download ${name} leaflet`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M6 1v7m0 0L3 5m3 3l3-3M2 11h8" stroke="currentColor" fill="none" stroke-width="1.2"/></svg>
          Leaflet
        </a>
      )}
    </div>
  </div>
</a>
```

- [ ] **Step 2: Verify**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/products/CategoryCard.astro
git commit -m "feat(catalog): CategoryCard component for /products grid"
```

---

## Task 11: Rewrite `/products/index.astro` as category grid

**Files:**
- Modify (full rewrite): `src/pages/products/index.astro`

Replace the cinematic showcase with the 13-card category grid. No client script. Static page.

- [ ] **Step 1: Rewrite the page**

Replace the entire contents of `src/pages/products/index.astro` with:

```astro
---
import Base from '~/layouts/Base.astro';
import CategoryCard from '~/components/products/CategoryCard.astro';
import { getCollection } from 'astro:content';
import '~/styles/catalog.css';

const categories = (await getCollection('categories')).sort((a, b) => a.data.order - b.data.order);
---
<Base title="Products — Elysee Irrigation" description="13 product categories: compression fittings, valves, saddles, pipes, drainage, and more.">
  <div class="catalog-scope">
    <section class="page-x pt-24 pb-12">
      <nav aria-label="Breadcrumb" class="cat-mono text-[11px] text-[var(--cat-ink-subtle)]">
        <a href="/" class="hover:text-[var(--cat-accent)]">Home</a>
        <span class="mx-2">/</span>
        <span aria-current="page">Products</span>
      </nav>
      <header class="mt-6 mb-12">
        <h1 class="cat-display text-5xl">Products</h1>
        <p class="text-base text-[var(--cat-ink-muted)] mt-3 max-w-xl">
          {categories.length} categories · 5,000+ product codes across agriculture, landscape, building, and industry.
        </p>
      </header>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map(c => (
          <CategoryCard
            name={c.data.name}
            slug={c.data.slug}
            image={c.data.image}
            blurb={c.data.blurb}
            leafletPdf={c.data.leafletPdf}
          />
        ))}
      </div>
    </section>
  </div>
</Base>
```

(Removes all GSAP-related imports and the cinematic ParticleFlow / FilterRail / ProductCard imports.)

- [ ] **Step 2: Verify**

Run: `npm run check`
Expected: PASS.

Run: `npm run build`
Expected: PASS — `/products` builds.

- [ ] **Step 3: Commit**

```bash
git add src/pages/products/index.astro
git commit -m "feat(products): rewrite /products as 13-category grid"
```

---

## Task 12: New `/catalog/[category]/index.astro` + update page-init.ts

**Files:**
- Delete: `src/pages/catalog/index.astro`
- Create: `src/pages/catalog/[category]/index.astro`
- Modify: `src/scripts/catalog/page-init.ts`

This is the per-category listing page. Replaces the flat `/catalog` route.

- [ ] **Step 1: Update `initCatalogPage` signature in page-init.ts**

In `src/scripts/catalog/page-init.ts`:

Change the imports:

```ts
import type { CatalogProduct, CategorySlug, Country, Filters, SortKey } from './types';
import { EMPTY_FILTERS } from './types';
import { applyFilters, byCategory, byCountry, sortProducts } from './filter-engine';
```

Change the function signature:

```ts
export function initCatalogPage(country: Country, categorySlug: CategorySlug) {
```

Change the product narrowing (the section that currently does `const allProducts = JSON.parse(...); const products = byCountry(allProducts, country);`):

```ts
const productsJson = root.querySelector<HTMLElement>('[data-products-json]')?.textContent ?? '[]';
const allProducts: CatalogProduct[] = JSON.parse(productsJson);
const products: CatalogProduct[] = byCategory(byCountry(allProducts, country), categorySlug);
```

(Everything downstream — filter, sort, render, etc. — keeps using `products`.)

- [ ] **Step 2: Create the new page**

Create `src/pages/catalog/[category]/index.astro`:

```astro
---
import Base from '~/layouts/Base.astro';
import { getCollection } from 'astro:content';
import { deriveFacets } from '~/scripts/catalog/derive-facets';
import { byCategory, byCountry } from '~/scripts/catalog/filter-engine';
import { COUNTRIES, type Country, type CatalogProduct, CATEGORY_SLUGS, type CategorySlug } from '~/scripts/catalog/types';
import '~/styles/catalog.css';
import CatalogHero from '~/components/catalog/CatalogHero.astro';
import UtilityBar from '~/components/catalog/UtilityBar.astro';
import ProductGrid from '~/components/catalog/ProductGrid.astro';
import FilterRail from '~/components/catalog/FilterRail.astro';
import QuoteBasket from '~/components/catalog/QuoteBasket.astro';
import CountryModal from '~/components/catalog/CountryModal.astro';
import CategoriesNav from '~/components/catalog/CategoriesNav.astro';

export async function getStaticPaths() {
  const categories = await getCollection('categories');
  return categories.map(c => ({ params: { category: c.data.slug }, props: { categoryEntry: c } }));
}

const { category } = Astro.params as { category: CategorySlug };
const { categoryEntry } = Astro.props;

const collection = await getCollection('products');
const products: CatalogProduct[] = collection.map(c => ({
  slug: c.slug,
  name: c.data.name,
  code: c.data.code,
  categorySlug: c.data.categorySlug,
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

const categoryProducts = byCategory(products, category);
const isEmpty = categoryProducts.length === 0;

const productsByCountry = Object.fromEntries(
  COUNTRIES.map(c => [c.id, byCategory(byCountry(products, c.id), category)])
) as Record<Country, CatalogProduct[]>;

const facetsByCountry = Object.fromEntries(
  COUNTRIES.map(c => [c.id, deriveFacets(productsByCountry[c.id])])
) as Record<Country, ReturnType<typeof deriveFacets>>;

const productsJson = JSON.stringify(products);
---
<Base title={`${categoryEntry.data.name} — Catalog — Elysee Irrigation`} description={categoryEntry.data.blurb}>
  <div class="catalog-scope" data-catalog-root>
    {!isEmpty && <CountryModal />}
    <section class="page-x pt-24 pb-12">
      <nav aria-label="Breadcrumb" class="cat-mono text-[11px] text-[var(--cat-ink-subtle)]">
        <a href="/" class="hover:text-[var(--cat-accent)]">Home</a>
        <span class="mx-2">/</span>
        <a href="/products" class="hover:text-[var(--cat-accent)]">Products</a>
        <span class="mx-2">/</span>
        <span aria-current="page">{categoryEntry.data.name}</span>
      </nav>

      <header class="mt-6 mb-8">
        <h1 class="cat-display text-4xl">{categoryEntry.data.name}</h1>
        <p class="text-sm text-[var(--cat-ink-muted)] mt-2">{categoryEntry.data.blurb}</p>
      </header>

      {isEmpty ? (
        <div class="grid grid-cols-12 gap-6 py-6">
          <aside class="col-span-12 md:col-span-3 lg:col-span-3">
            <CategoriesNav active={category} />
          </aside>
          <section class="col-span-12 md:col-span-9 lg:col-span-9 flex flex-col items-center justify-center py-24 text-center">
            <p class="cat-display text-xl">No products in this category yet.</p>
            <p class="text-sm text-[var(--cat-ink-muted)] mt-2">We're still cataloguing this section. Coming soon.</p>
            <a href="/products" class="cat-btn cat-btn--ghost mt-6">Back to all categories</a>
          </section>
        </div>
      ) : (
        <div class="grid grid-cols-12 gap-6 py-6">
          <aside class="col-span-12 md:col-span-3 lg:col-span-3 flex flex-col gap-8">
            <CategoriesNav active={category} />
            {COUNTRIES.map(c => (
              <div data-country-rail={c.id} hidden>
                <FilterRail facets={facetsByCountry[c.id]} count={productsByCountry[c.id].length} />
              </div>
            ))}
          </aside>
          <section class="col-span-12 md:col-span-9 lg:col-span-9">
            <UtilityBar count={categoryProducts.length} />
            <ProductGrid products={categoryProducts} />
          </section>
        </div>
      )}

      <pre data-products-json style="display:none">{productsJson}</pre>
    </section>
  </div>
  {!isEmpty && <QuoteBasket />}
  <script define:vars={{ category }}>
    import('~/scripts/catalog/page-init').then(({ initCatalogPage }) => {
      import('~/scripts/catalog/basket-ui').then(({ initBasketUi }) => {
        import('~/scripts/catalog/country-modal').then(({ openCountryModal }) => {
          function go() {
            initBasketUi();
            const empty = !document.querySelector('[data-country-modal]');
            if (empty) return;
            openCountryModal((picked) => {
              initCatalogPage(picked, category);
            });
          }
          if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
          else go();
        });
      });
    });
  </script>
</Base>
```

- [ ] **Step 3: Delete the old `/catalog/index.astro`**

Run: `git rm src/pages/catalog/index.astro`

- [ ] **Step 4: Verify**

Run: `npm run check`
Expected: PASS.

Run: `npm run build`
Expected: PASS — 13 `/catalog/<slug>/index.html` pages generated. Empty categories build successfully.

- [ ] **Step 5: Commit**

```bash
git add src/pages/catalog src/scripts/catalog/page-init.ts
git commit -m "feat(catalog): per-category listing page with sidebar nav and empty-state"
```

---

## Task 13: New `/catalog/[category]/[product].astro` + update page-init-detail.ts

**Files:**
- Delete: `src/pages/catalog/[slug].astro`
- Create: `src/pages/catalog/[category]/[product].astro`
- Modify: `src/scripts/catalog/page-init-detail.ts`

The nested detail route replaces the flat `/catalog/<slug>`. The category param is consumed for breadcrumb + Related Products scoping.

- [ ] **Step 1: Update `initDetailPage` signature**

In `src/scripts/catalog/page-init-detail.ts`, change the function signature:

```ts
export function initDetailPage(country: Country, categorySlug: CategorySlug) {
```

Add the import:

```ts
import type { Country, CategorySlug } from './types';
```

(The `categorySlug` arg isn't used inside the function body in the current implementation — Related Products is server-rendered. But thread it through for symmetry and future use.)

- [ ] **Step 2: Create the new page**

Create `src/pages/catalog/[category]/[product].astro`:

```astro
---
import Base from '~/layouts/Base.astro';
import { getCollection } from 'astro:content';
import type { CatalogProduct, CategorySlug } from '~/scripts/catalog/types';
import DetailHero from '~/components/catalog/DetailHero.astro';
import TabBar from '~/components/catalog/TabBar.astro';
import RelatedProducts from '~/components/catalog/RelatedProducts.astro';
import CountryModal from '~/components/catalog/CountryModal.astro';
import '~/styles/catalog.css';
import QuoteBasket from '~/components/catalog/QuoteBasket.astro';

export async function getStaticPaths() {
  const products = await getCollection('products');
  const categories = await getCollection('categories');
  const categoryByName: Record<string, typeof categories[0]> = Object.fromEntries(
    categories.map(c => [c.data.slug, c])
  );
  return products.map(p => ({
    params: { category: p.data.categorySlug, product: p.slug },
    props: { entry: p, categoryEntry: categoryByName[p.data.categorySlug], all: products }
  }));
}

const { entry, categoryEntry, all } = Astro.props;
const { category } = Astro.params as { category: CategorySlug };

const p: CatalogProduct = {
  slug: entry.slug,
  name: entry.data.name,
  code: entry.data.code,
  categorySlug: entry.data.categorySlug,
  sectors: entry.data.sectors,
  material: entry.data.material,
  dnRange: entry.data.dnRange,
  pnRating: entry.data.pnRating,
  standards: entry.data.standards,
  imageUrls: entry.data.imageUrls,
  image: entry.data.image,
  blurb: entry.data.blurb,
  pressure: entry.data.pressure,
  sizeRange: entry.data.sizeRange,
  bim: entry.data.bim,
  datasheet: entry.data.datasheet,
  installation: entry.data.installation,
  specs: entry.data.specs,
  featured: entry.data.featured,
  availableCountries: entry.data.availableCountries
};

const related: CatalogProduct[] = all
  .filter(x => x.slug !== p.slug && x.data.categorySlug === p.categorySlug)
  .slice(0, 4)
  .map(c => ({
    slug: c.slug,
    name: c.data.name,
    code: c.data.code,
    categorySlug: c.data.categorySlug,
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
---
<Base title={`${p.name} — Catalog — Elysee Irrigation`} description={p.blurb}>
  <div class="catalog-scope" data-catalog-detail
       data-product-slug={p.slug}
       data-product-countries={p.availableCountries.join(',')}>
    <CountryModal />
    <section class="page-x pt-24 pb-8">
      <nav aria-label="Breadcrumb" class="cat-mono text-[11px] text-[var(--cat-ink-subtle)]">
        <a href="/" class="hover:text-[var(--cat-accent)]">Home</a>
        <span class="mx-2">/</span>
        <a href="/products" class="hover:text-[var(--cat-accent)]">Products</a>
        <span class="mx-2">/</span>
        <a href={`/catalog/${categoryEntry.data.slug}`} class="hover:text-[var(--cat-accent)]">{categoryEntry.data.name}</a>
        <span class="mx-2">/</span>
        <span aria-current="page">{p.name}</span>
      </nav>
      <DetailHero product={p} />
      <TabBar product={p} />
      <RelatedProducts products={related} />
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
    </section>
  </div>
  <QuoteBasket />
  <script define:vars={{ category }}>
    import('~/scripts/catalog/page-init-detail').then(({ initDetailPage }) => {
      import('~/scripts/catalog/basket-ui').then(({ initBasketUi }) => {
        import('~/scripts/catalog/country-modal').then(({ openCountryModal }) => {
          function go() {
            initBasketUi();
            openCountryModal((picked) => {
              initDetailPage(picked, category);
            });
          }
          if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
          else go();
        });
      });
    });
  </script>
</Base>
```

- [ ] **Step 3: Delete the old detail page**

Run: `git rm src/pages/catalog/[slug].astro`

- [ ] **Step 4: Verify**

Run: `npm run check`
Expected: PASS.

Run: `npm run build`
Expected: PASS — 8 nested detail pages generated under `dist/catalog/<category>/<product>/index.html`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/catalog src/scripts/catalog/page-init-detail.ts
git commit -m "feat(catalog): nested product detail page with category breadcrumb"
```

---

## Task 14: Delete cinematic Epsilon files + orphan components, update EpsilonCameo link

**Files:**
- Delete: `src/pages/products/epsilon.astro`
- Delete: `src/components/products/EpsilonStage.astro`
- Delete: `src/components/products/ProductCard.astro` (orphan)
- Delete: `src/components/products/FilterRail.astro` (orphan)
- Delete: `src/scripts/motion/timelines/epsilonPage.ts`
- Delete: `src/scripts/motion/timelines/productsFilter.ts`
- Modify: `src/components/sections/EpsilonCameo.astro` (link only)

The cinematic Epsilon page and its dependencies are removed. `EpsilonCameo.astro` is **kept** because it's a homepage section — only its link to `/products/epsilon` is updated to the new route.

- [ ] **Step 1: Verify EpsilonCameo references**

Run: `grep -rn '/products/epsilon' src/`
Expected: hits in `src/components/sections/EpsilonCameo.astro` and possibly `src/scripts/motion/timelines/*.ts`. Note each hit.

Run: `grep -rn 'EpsilonStage\|productsFilter' src/`
Expected: only references in `src/pages/products/epsilon.astro` (which we're deleting) and `src/components/products/FilterRail.astro` / `src/components/products/ProductCard.astro` (also orphans). No homepage references.

- [ ] **Step 2: Update EpsilonCameo link**

In `src/components/sections/EpsilonCameo.astro`, find the line containing `href="/products/epsilon"` (or similar) and change it to `href="/catalog/compression-fittings/epsilon"`. There may be multiple — replace all of them.

If EpsilonCameo embeds the link via a JS `data-href` or similar, update those too based on the grep output.

- [ ] **Step 3: Delete the files**

Run:

```bash
git rm src/pages/products/epsilon.astro
git rm src/components/products/EpsilonStage.astro
git rm src/components/products/ProductCard.astro
git rm src/components/products/FilterRail.astro
git rm src/scripts/motion/timelines/epsilonPage.ts
git rm src/scripts/motion/timelines/productsFilter.ts
```

- [ ] **Step 4: Verify**

Run: `npm run check`
Expected: PASS — no missing references.

If `npm run check` reports a missing import (e.g., from `epsilonCameo.ts` referencing `epsilonPage`, or a sections file referencing `EpsilonStage`), fix the dangling import and re-run.

Run: `npm run build`
Expected: PASS — 13 categories + 8 products + homepage + 404 = 23 pages built.

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/EpsilonCameo.astro src/pages src/components/products src/scripts/motion/timelines
git commit -m "refactor(products): delete cinematic epsilon page, orphan components, update homepage link"
```

---

## Task 15: Add Astro redirects for old URLs

**Files:**
- Modify: `astro.config.mjs`

Add static redirects so existing bookmarks resolve.

- [ ] **Step 1: Edit astro.config.mjs**

Add a `redirects` block to the existing `defineConfig` call. The full file should look like:

```ts
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import compress from 'astro-compress';

export default defineConfig({
  site: 'https://elysee.com.cy',
  integrations: [mdx(), sitemap(), compress({ HTML: true, CSS: true, JavaScript: true, SVG: true, Image: false })],
  image: { service: { entrypoint: 'astro/assets/services/sharp' } },
  redirects: {
    '/catalog':                     '/products',
    '/catalog/epsilon':             '/catalog/compression-fittings/epsilon',
    '/catalog/coupling-repair':     '/catalog/compression-fittings/coupling-repair',
    '/catalog/coupling-transition': '/catalog/compression-fittings/coupling-transition',
    '/catalog/adaptor-flanged':     '/catalog/hydraulic-fittings/adaptor-flanged',
    '/catalog/single-4-bolts':      '/catalog/hydraulic-fittings/single-4-bolts',
    '/catalog/saddle-clamp':        '/catalog/saddles/saddle-clamp',
    '/catalog/pvc-ball-valve':      '/catalog/valves/pvc-ball-valve',
    '/catalog/double-union-glued':  '/catalog/valves/double-union-glued',
    '/products/epsilon':            '/catalog/compression-fittings/epsilon'
  },
  vite: {
    plugins: [tailwindcss()],
    ssr: { noExternal: ['gsap', 'ogl', 'lenis'] }
  },
  experimental: { clientPrerender: true }
});
```

- [ ] **Step 2: Verify**

Run: `npm run build`
Expected: PASS. The build output includes a redirect HTML page for each entry. Inspect `dist/catalog/index.html` and confirm it contains a `<meta http-equiv="refresh" content="0; url=/products">` or equivalent.

Run: `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:<port>/catalog/epsilon` (with `npm run preview` running) — should return 200 or 301.

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "feat(catalog): redirects for legacy /catalog and /products/epsilon URLs"
```

---

## Task 16: Add categoriesContent.test.ts

**Files:**
- Create: `tests/categoriesContent.test.ts`

Asserts the content collection has exactly 13 entries with valid slugs and unique order values.

- [ ] **Step 1: Create the test**

Create `tests/categoriesContent.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CATEGORY_SLUGS } from '~/scripts/catalog/types';

const CATEGORIES_DIR = join(process.cwd(), 'src', 'content', 'categories');

interface ParsedCategory {
  slug?: string;
  name?: string;
  order?: number;
  image?: string;
  blurb?: string;
}

function parseFrontmatter(content: string): ParsedCategory {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm: ParsedCategory = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    const [, k, v] = kv;
    if (k === 'order') (fm as any)[k] = Number(v);
    else (fm as any)[k] = v.trim();
  }
  return fm;
}

describe('categories content collection', () => {
  const files = readdirSync(CATEGORIES_DIR).filter(f => f.endsWith('.mdx'));
  const parsed = files.map(f => ({
    file: f,
    fm: parseFrontmatter(readFileSync(join(CATEGORIES_DIR, f), 'utf-8'))
  }));

  it('has exactly 13 entries', () => {
    expect(files.length).toBe(13);
  });

  it('every slug is a valid CategorySlug', () => {
    const slugs = parsed.map(p => p.fm.slug);
    for (const s of slugs) {
      expect(CATEGORY_SLUGS).toContain(s);
    }
  });

  it('all 13 CategorySlugs are represented (no duplicates, no missing)', () => {
    const slugs = parsed.map(p => p.fm.slug).sort();
    const expected = [...CATEGORY_SLUGS].sort();
    expect(slugs).toEqual(expected);
  });

  it('every entry has unique order in 0..12', () => {
    const orders = parsed.map(p => p.fm.order).sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(orders).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('every entry has name, image, blurb', () => {
    for (const p of parsed) {
      expect(p.fm.name).toBeTruthy();
      expect(p.fm.image).toBeTruthy();
      expect(p.fm.blurb).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npx vitest run tests/categoriesContent.test.ts`
Expected: PASS — 5 cases.

- [ ] **Step 3: Commit**

```bash
git add tests/categoriesContent.test.ts
git commit -m "test(catalog): assert categories collection structure"
```

---

## Task 17: Extend integration test with country + category coverage

**Files:**
- Modify: `tests/catalogIntegration.test.ts`

- [ ] **Step 1: Add the test case**

In `tests/catalogIntegration.test.ts`, add the import for `byCategory` to the existing import line:

```ts
import { applyFilters, byCategory, byCountry, sortProducts } from '~/scripts/catalog/filter-engine';
```

Add a new `it` block inside the `describe('catalog integration', ...)` block, before the closing `});`:

```ts
it('country-3 + valves narrows to pvc-ball-valve only', () => {
  const out = byCategory(byCountry(demo, 'country-3'), 'valves');
  expect(out.map(p => p.slug)).toEqual(['pvc-ball-valve']);
});

it('country-2 + compression-fittings narrows to epsilon only', () => {
  const out = byCategory(byCountry(demo, 'country-2'), 'compression-fittings');
  expect(out.map(p => p.slug)).toEqual(['epsilon']);
});
```

(The first asserts that double-union-glued, which is country-1 only, is excluded when filtering for country-3 + valves. The second confirms that country-2 has only epsilon under compression-fittings.)

- [ ] **Step 2: Run the test**

Run: `npx vitest run tests/catalogIntegration.test.ts`
Expected: PASS — original cases + 2 new ones.

- [ ] **Step 3: Commit**

```bash
git add tests/catalogIntegration.test.ts
git commit -m "test(catalog): integration coverage for country + category compose"
```

---

## Task 18: Final verification and acceptance walk-through

**Files:** none modified — verification step.

- [ ] **Step 1: Run all gates**

Run: `npm run check && npm run test && npm run build`
Expected: all PASS. ~85+ tests passing.

- [ ] **Step 2: Manual smoke**

Start the dev server (`npm run dev`) and walk through each acceptance criterion from the spec:

- [ ] `/products` shows 13 cards in a 3-column grid; clicking a card navigates to `/catalog/<slug>`.
- [ ] `/catalog/compression-fittings` shows the listing with sidebar (Categories nav + filters), country modal opens on entry, after pick the grid shows the country-scoped subset of compression fittings.
- [ ] `/catalog/polyethylene-pipes` (or any of the 9 empty categories) shows the empty state ("No products in this category yet") with a "Back to all categories" button. No country modal.
- [ ] Filter rail no longer has a Category facet group.
- [ ] `/catalog/compression-fittings/epsilon` renders the flat detail page (gallery, sticky info, tabs, related products from same category, CTA).
- [ ] Old URLs redirect: visit `/catalog`, `/catalog/epsilon`, `/products/epsilon` — each should land on the new route.
- [ ] `/products/epsilon` is no longer a cinematic page; either redirected or 404 (depends on Astro static redirects).
- [ ] Homepage's EpsilonCameo link goes to `/catalog/compression-fittings/epsilon`.
- [ ] All 13 category card images render on `/products` (no broken images).

- [ ] **Step 3: Optional fix-up commit**

If a manual smoke step revealed a small issue, commit a single fix as `fix(catalog): post-review cleanup` (or similar).

---

## Self-review checklist

**Spec coverage:**
- §1 Background — informational, no task.
- §2.1 In scope — Tasks 1–17 cover every listed item.
- §3 Route map — Tasks 11, 12, 13 (new routes), Task 15 (redirects).
- §4.1 Categories collection — Task 4.
- §4.2 Product schema — Task 3.
- §4.3 Type changes — Tasks 1, 3.
- §4.4 Filters — Task 3.
- §5.1 /products page — Tasks 10 (CategoryCard), 11 (page).
- §5.2 /catalog/<category> — Task 12 (page) + Task 9 (CategoriesNav) + Task 7 (ProductCard simplification) + Task 3 (FilterRail Category facet removal).
- §5.3 /catalog/<category>/<product> — Task 13.
- §5.4 Cinematic deletions — Task 14.
- §6 Image fetch — Tasks 5 (script), 6 (run).
- §7 byCategory — Tasks 1, 2.
- §8 Page wiring — Tasks 12, 13.
- §9 Edge cases — covered across 12 (empty state) and 14 (link update) and 15 (redirects).
- §10 Testing — Tasks 2 (byCategory), 3 (factory updates), 16 (collection), 17 (integration extension).
- §11 Files changed — every file in the spec maps to a task.
- §12 Acceptance criteria — Task 18.

**Placeholder scan:** No "TBD" / "TODO" / "fill in" / "add appropriate error handling" patterns. Every code block is concrete. The Task 6 fallback ("manually copy placeholder.svg") is a real instruction tied to a specific failure mode.

**Type consistency:** `CategorySlug`, `CATEGORY_SLUGS`, `byCategory`, `categorySlug` (field name), `initCatalogPage(country, categorySlug)`, `initDetailPage(country, categorySlug)` — all consistent. Filter rail data attribute is `data-country-rail` (matches existing pattern from prior plan).

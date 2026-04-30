# Products & Catalog — Elysee Morphology (Design Spec)

**Status:** Approved for planning
**Date:** 2026-04-30
**Scope:** Restructure `/products` and `/catalog` to mirror the architecture of `elysee.com.cy/products-catalogue-en` and `elysee.com.cy/cat-e-epsilon-series-pn-16-bar-11001`. Big-bang cut-over.
**Stack:** Astro 5 · Tailwind v4 · MDX · Vitest (existing project)
**Related:** `2026-04-27-catalog-country-gate-design.md` (preserved), `2026-04-27-products-rs-catalog-demo-design.md` (superseded by this spec)

---

## 1. Background and intent

The current site has two parallel product surfaces:

- **`/products`** — a cinematic showcase with a single 5-act GSAP deep-dive at `/products/epsilon`. Curated story; one product visible.
- **`/catalog`** — an RS-Components-style flat catalog with all 8 demo products, filter rail, sort, search, quote basket, country gate.

The user wants a new architecture that mirrors Elysee's actual production site:

- `/products` becomes a **13-card category brochure** (replaces cinematic showcase).
- `/catalog/<category>` becomes a **per-category product listing** (replaces the flat `/catalog`).
- `/catalog/<category>/<product>` becomes a **flat product detail page** (replaces both the flat `/catalog/<slug>` and the cinematic Epsilon page).

**Key choices the user has confirmed during brainstorming:**

| Decision | Choice |
|---|---|
| Replace existing `/catalog`, retain features | C — adopt Elysee morphology + keep filters / quote basket / country gate as enhancements |
| Route structure | A — `/catalog/<category-slug>/<product-slug>` |
| Cinematic `/products/epsilon` | C — remove (closest to Elysee's flow) |
| Empty categories | A — show all 13, empty ones link to an empty-state listing |
| Image hosting | B — download once and store at `/public/images/categories/<slug>.png` |
| Country gate | A — gate at `/catalog/<category>`; `/products` is unrestricted |

## 2. Scope

### 2.1 In scope

- Replace `src/pages/products/index.astro` with a category-grid page.
- Delete `src/pages/products/epsilon.astro` and the cinematic-only components it owns.
- Replace `src/pages/catalog/index.astro` with `src/pages/catalog/[category]/index.astro` (per-category listing).
- Replace `src/pages/catalog/[slug].astro` with `src/pages/catalog/[category]/[product].astro` (nested detail).
- New `categories` content collection with 13 MDX entries.
- New `categorySlug` required field on every product MDX (replaces the existing `category` enum).
- New `byCategory` helper in `filter-engine.ts`.
- New `CategoryCard` and `CategoriesNav` components.
- Astro `redirects` for old URLs so existing bookmarks resolve.
- Image fetch script (one-time, local) that downloads 13 category PNGs from elysee.com.cy.
- Existing 8 products tagged with their category and remapped under nested URLs.

### 2.2 Out of scope (explicitly deferred)

- Multi-language switcher (EN/GR/DE/ES on the original Elysee site).
- Real PDF leaflets per category — schema supports the field, but rendering only when populated.
- 4-level hierarchy (Elysee has Category → Series → Products). The demo collapses Series into Category — e.g., all Epsilon products live directly under "Compression Fittings", no intermediate `/catalog/compression-fittings/epsilon-series/*` route.
- Breadcrumb structured data (BreadcrumbList JSON-LD).
- Restoring localStorage persistence on the country gate — testing-mode flag from commit `635e6a9` stays on for this demo.

## 3. Route map

### 3.1 New routes

| Route | Renders | Source file |
|---|---|---|
| `/products` | 13-card category grid | `src/pages/products/index.astro` (rewritten) |
| `/catalog/<category>` | Per-category product listing with sidebar nav + filters + country gate | `src/pages/catalog/[category]/index.astro` (new) |
| `/catalog/<category>/<product>` | Flat Elysee-style product detail | `src/pages/catalog/[category]/[product].astro` (new) |

### 3.2 Removed routes

| Old route | Status |
|---|---|
| `/products/epsilon` | Deleted; redirects to `/catalog/compression-fittings/epsilon` |
| `/catalog` | Deleted; redirects to `/products` |
| `/catalog/<slug>` | Deleted; per-slug redirects to `/catalog/<category>/<slug>` (8 explicit entries) |

### 3.3 Astro redirects

Added to `astro.config.mjs` under the existing `defineConfig` block:

```ts
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
}
```

Astro emits each redirect as a static HTML page with `<meta http-equiv="refresh">` plus `Location` header support (works on Vercel and Netlify out of the box).

### 3.4 Category slugs (kebab-case English)

```
1.  compression-fittings
2.  hydraulic-fittings
3.  saddles
4.  light-weight-fittings
5.  valves
6.  filters-and-dosers
7.  micro-irrigation-and-sprinklers
8.  turf
9.  polyethylene-pipes
10. pvc-pressure-pipes-and-fittings
11. network-drainage
12. cable-applications
13. building-sewerage
```

### 3.5 Existing 8 products → category mapping

| Slug | Category |
|---|---|
| epsilon | compression-fittings |
| coupling-repair | compression-fittings |
| coupling-transition | compression-fittings |
| adaptor-flanged | hydraulic-fittings |
| single-4-bolts | hydraulic-fittings |
| saddle-clamp | saddles |
| pvc-ball-valve | valves |
| double-union-glued | valves |

The other 9 categories ship with **0 products** in the demo and render an empty state.

## 4. Data model

### 4.1 New `categories` content collection

`src/content/categories/<slug>.mdx` — one file per category. Schema:

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

Field roles:
- `name` — display title.
- `slug` — must equal the filename (without `.mdx`); used for URLs.
- `order` — display order in the `/products` grid (0–12).
- `image` — local path under `/public`, e.g., `/images/categories/compression-fittings.png`.
- `sourceImage` — optional; the elysee.com.cy URL used by the fetch script. Never read at render time.
- `leafletPdf` — optional path to a PDF leaflet under `/public`. Card renders a download icon only when set.
- `blurb` — one-line subtitle on the card.

The MDX body is reserved for future longer-form copy; empty body is acceptable.

### 4.2 Product schema changes

`src/content/config.ts` — modify the products schema:

- **Remove:** `category: z.enum([...]).` (the existing six-value enum)
- **Add:** `categorySlug: z.enum([... 13 slugs above])` (required; non-empty)

### 4.3 `CatalogProduct` type changes

`src/scripts/catalog/types.ts`:

```ts
// Removed: Category type, the six-value union
// Added:
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
  // ...other fields unchanged...
  // category: Category;     ← removed
  categorySlug: CategorySlug;  // ← added
}
```

The existing `availableCountries: Country[]` field from `2026-04-27-catalog-country-gate-design.md` is preserved on every product.

### 4.4 Filters interface

`Filters.categories: Category[]` is **removed** from the user-facing filter interface — category is now URL-driven, so the facet checkbox would just navigate. The `Filters` type drops that field; `applyFilters` drops the corresponding branch; `deriveFacets` no longer surfaces a categories list. Active-filter chips drop the categories chip.

## 5. Page templates

### 5.1 `/products` — category grid

**Layout:**
```
[ breadcrumb: Home > Products ]
[ page title "Products" ]
[ optional intro paragraph ]
[ 3-column grid of 13 CategoryCard ]
[ ContactFooter (existing component, kept) ]
```

**`CategoryCard` (`src/components/products/CategoryCard.astro`):**
```astro
<a href={`/catalog/${slug}`} class="category-card">
  <img src={image} alt={name} loading="lazy" />
  <h3>{name}</h3>
  <p class="blurb">{blurb}</p>
  <div class="card-actions">
    <span class="view-link">View products →</span>
    {leafletPdf && (
      <a href={leafletPdf} class="leaflet-icon" onclick="event.stopPropagation()" download>
        <PdfIcon /> Leaflet
      </a>
    )}
  </div>
</a>
```

The whole card is one anchor; the leaflet anchor is nested with `stopPropagation` so clicking it doesn't follow the parent link.

**Removed:** the entire current `/products/index.astro` body (Hero, FourWorlds, GlobalMap, Counters, EpsilonCameo, Insights, Manifesto sections). The `Hero`/`Counters`/`Insights`/`Manifesto`/`FourWorlds`/`GlobalMap` components themselves stay in `src/components/sections/` because they're still used by `/` (the homepage).

**Country gate:** not rendered on `/products`. The `<CountryModal />` component is not imported or mounted here.

### 5.2 `/catalog/<category>` — per-category listing

**Layout (3-column on desktop, stacked on mobile):**
```
[ breadcrumb: Home > Products > <Category Name> ]
[ page title (Category) + count "Showing N of M products" ]

[ left sidebar (col-3) ]              [ products area (col-9) ]
                                       
- Categories nav                       [ utility bar: search · sort · view toggle ]
  Compression Fittings                 [ active filter chips ]
  Hydraulic Fittings ◄ active          [ product grid (Elysee-style ProductCard) ]
  Saddles
  ... (13 total)
                                       
- Filters
  Sector
  Material
  Size range (DN/PN)
  Standards
  Other (datasheet, BIM)
```

**Sidebar = stacked `CategoriesNav` (top) + existing `FilterRail` (bottom) inside a single `<aside>`.**

`CategoriesNav` (`src/components/catalog/CategoriesNav.astro`):
- Renders all 13 categories as a vertical link list, ordered by `order`.
- Active category gets `aria-current="page"` and a visual highlight (left border + bold).
- Categories with 0 products in the user's country render in muted text (no "(0)" count visible until the gate is passed; recomputed client-side after pick).

**`ProductCard` morphology change:** the existing card has 3 inline stats (PN / DN / material). For Elysee parity, the new card shows only **image · code · name · "View details →"**. The stats are removed but the underlying data stays in `CatalogProduct` (used on the detail page).

**Filter rail:** unchanged from the existing implementation EXCEPT the Category facet is removed. The 3-rails-per-country pattern from the previous catalog work is preserved (one rail per country, JS keeps the active one).

**Empty category state:**
- If `byCategory(allProducts, category).length === 0` (no products of any country) → render: "No products in this category yet — coming soon" + "Back to all categories" button. Filter rail and search are hidden. Country modal is not opened (nothing to gate).
- If filtering produces zero hits within a populated category → existing `EmptyResults` "Clear filters" path (unchanged).

**Country gate:** opens on first visit. After pick, the country narrows the working set, then `byCategory(scopedByCountry, categorySlug)` narrows to the category. Filter rail counts re-derive from that final set.

### 5.3 `/catalog/<category>/<product>` — product detail

**Layout (Elysee-style flat detail; no GSAP cinema):**
```
[ breadcrumb: Home > Products > <Category> > <Product Name> ]
[ DetailHero — 2-col: gallery left · sticky info column right (code, key specs, "Add to quote") ]
[ TabBar: Specifications | Standards | Installation ]
[ RelatedProducts — same category only ]
[ "Need this in your project?" CTA + Talk to engineering link ]
```

**Reused unchanged:** `DetailHero`, `TabBar`, `SpecTable`, `KeySpecs`, `RelatedProducts`, `EmptyResults`, the not-available-in-country notice, `QuoteBasket`, `CountryModal`.

**Related Products** is now scoped to `categorySlug` (same category siblings only, max 4). This is a tightening from the old behavior (which used category OR sector overlap).

**Country gate:** same as the listing page. If the product isn't in the chosen country, the bottom CTA region is replaced with the existing "Not available in {country}" notice (Task 8 of the prior spec, unchanged).

### 5.4 Components removed (along with cinematic Epsilon)

Files deleted:
- `src/pages/products/epsilon.astro`
- `src/components/products/EpsilonStage.astro`
- `src/components/sections/EpsilonCameo.astro`
- Any GSAP timeline modules used **only** by the Epsilon page (verified by grep before deletion — `src/scripts/motion/timelines/epsilon*.ts` if present)

`Hero`, `FourWorlds`, `GlobalMap`, `Counters`, `Insights`, `Manifesto`, `ContactFooter` stay — they're used by the homepage.

## 6. Image fetch script

`scripts/categories/fetch-images.ts` — one-time setup script run locally:

```ts
// Reads src/content/categories/*.mdx for `sourceImage`, fetches each PNG with a
// User-Agent header, writes to public/images/categories/<slug>.png. Logs a
// summary; non-fatal failures are reported but don't abort the run.
```

Run with: `node scripts/categories/fetch-images.ts`

The 13 PNGs are committed to the repo (under `public/images/categories/`) so production builds are self-contained and don't depend on Elysee's CDN.

If a fetch fails, a placeholder SVG (`public/images/categories/placeholder.svg`) is used at render time via the existing `image` field — but this is a manual fallback the developer applies by editing the MDX, not automatic.

## 7. Filter pipeline

`src/scripts/catalog/filter-engine.ts` adds:

```ts
export function byCategory(
  products: CatalogProduct[],
  slug: CategorySlug
): CatalogProduct[] {
  return products.filter(p => p.categorySlug === slug);
}
```

The new `initCatalogPage` signature: `initCatalogPage(country: Country, categorySlug: CategorySlug)`. Inside:

```ts
const all     = parseProductsJson();
const scoped  = byCategory(byCountry(all, country), categorySlug);
const facets  = deriveFacets(scoped);
// rest of init operates on `scoped`
```

The detail page's `initDetailPage` adds the category param (mostly for breadcrumb labels and Related Products scoping): `initDetailPage(country: Country, categorySlug: CategorySlug)`.

## 8. Page wiring

### 8.1 `src/pages/catalog/[category]/index.astro`

- `getStaticPaths` returns one path per category (13 paths).
- Frontmatter computes `productsByCountry` (3 lookups) and `facetsByCountry` (3 lookups), each scoped first by country and **then** by `categorySlug`. Facets pre-rendered for all 3 countries (mirrors the previous Task 7 fix).
- Sidebar renders `CategoriesNav` (always) + 3 `<FilterRail>` instances each wrapped in `<div data-country-rail={c.id} hidden>` (existing pattern from the country-gate work).
- Boot script (testing-mode):
  ```ts
  function go() {
    initBasketUi();
    openCountryModal((picked) => {
      initCatalogPage(picked, CATEGORY_SLUG); // CATEGORY_SLUG embedded by Astro at build
    });
  }
  ```

### 8.2 `src/pages/catalog/[category]/[product].astro`

- `getStaticPaths` returns one path per (category, product) pair derived from the product collection's `categorySlug` field. Total = 8 paths.
- The `data-product-countries` attribute is preserved (powers the not-available notice).
- Boot script (testing-mode):
  ```ts
  function go() {
    initBasketUi();
    openCountryModal((picked) => {
      initDetailPage(picked, CATEGORY_SLUG);
    });
  }
  ```

### 8.3 `src/pages/products/index.astro`

- Frontmatter loads `categories` collection ordered by `order`.
- Renders `<CategoryCard>` per entry. No client script (static page).
- No `<CountryModal />`. No `<QuoteBasket />` (basket is only shown where products exist).

## 9. Edge cases

| Case | Behavior |
|---|---|
| Bookmark to old `/catalog/<slug>` | 301 via Astro `redirects` to `/catalog/<category>/<slug>` |
| Bookmark to old `/catalog` | 301 to `/products` |
| Bookmark to old `/products/epsilon` | 301 to `/catalog/compression-fittings/epsilon` |
| Empty category (9 of 13) | Listing page renders breadcrumb + sidebar; main area shows "No products yet" empty state. Country modal not opened. |
| URL like `/catalog/compression-fittings/saddle-clamp` (mismatched category/product) | Astro `getStaticPaths` does not generate this combination → 404 |
| Filter rail `Category` facet | Removed entirely. The facet would be redundant with the URL. |
| Product available in country-2 only, but user is in country-3, deep-linked from elsewhere | Detail page renders; CTA region replaced with "Not available in Country 3" (unchanged from Task 8). |
| Category has only 1 product in the user's country | Renders normally. Filter rail counts may be sparse; that's correct. |
| Image fetch fails for a category | The `image` field still points at `/images/categories/<slug>.png`; if the file is missing the `<img>` shows a broken image. Developer manually points `image` at `placeholder.svg` until the fetch is re-run. |

## 10. Testing

**Update existing tests** to track the schema change (rename `category` → `categorySlug`):
- `tests/catalogFilterEngine.test.ts` — update factory + assertions referencing `category`.
- `tests/catalogIntegration.test.ts` — update demo array entries.
- `tests/catalogDeriveFacets.test.ts` — drop the now-removed categories facet test.
- `tests/catalogMiniSearch.test.ts` — update factory.
- `tests/catalogByCountry.test.ts` — update factory.
- `tests/catalogCountry.test.ts` — no change (storage module is unaffected).

**Add new tests:**
- `tests/catalogByCategory.test.ts` — assert `byCategory(demo, 'compression-fittings')` returns the 3 expected slugs (`epsilon`, `coupling-repair`, `coupling-transition`); empty for `polyethylene-pipes`.
- `tests/categoriesContent.test.ts` — read the categories collection at test time; assert exactly 13 entries, each with a unique slug matching `CATEGORY_SLUGS`, and unique `order` values 0–12.
- Extend `tests/catalogIntegration.test.ts` — assert that `byCategory(byCountry(demo, 'country-3'), 'valves')` returns just `pvc-ball-valve` (since `double-union-glued` is country-1 only).

Manual smoke covers all routes in the final verification step.

## 11. Files changed

**New:**
- `src/content/categories/compression-fittings.mdx` (and 12 siblings, one per category)
- `public/images/categories/<slug>.png` (× 13, fetched by the script)
- `public/images/categories/placeholder.svg` (1, manual)
- `src/components/products/CategoryCard.astro`
- `src/components/catalog/CategoriesNav.astro`
- `src/pages/catalog/[category]/index.astro`
- `src/pages/catalog/[category]/[product].astro`
- `scripts/categories/fetch-images.ts`
- `tests/catalogByCategory.test.ts`
- `tests/categoriesContent.test.ts`

**Modified:**
- `src/content/config.ts` — add `categories` collection; add `categorySlug` to products schema; remove old `category` enum.
- `src/scripts/catalog/types.ts` — add `CategorySlug`, `CATEGORY_SLUGS`; remove `Category`; rename `CatalogProduct.category` → `categorySlug`; drop `Filters.categories`.
- `src/scripts/catalog/filter-engine.ts` — add `byCategory`; drop the categories branch from `applyFilters`.
- `src/scripts/catalog/derive-facets.ts` — drop `categories` from `DerivedFacets`.
- `src/scripts/catalog/page-init.ts` — accept `(country, categorySlug)`; add `byCategory` step.
- `src/scripts/catalog/page-init-detail.ts` — accept `(country, categorySlug)`; tighten Related Products scoping.
- `src/components/catalog/FilterRail.astro` — remove the Category facet group.
- `src/components/catalog/ProductCard.astro` — remove the 3 inline stat chips for Elysee parity.
- `src/components/catalog/RelatedProducts.astro` — accept a category list filtered to same `categorySlug`.
- `src/pages/products/index.astro` — full rewrite (category grid).
- All 8 `src/content/products/*.mdx` — replace `category:` with `categorySlug:`.
- `astro.config.mjs` — add `redirects` block.
- 4 existing test files — factory updates per §10.

**Deleted:**
- `src/pages/products/epsilon.astro`
- `src/pages/catalog/index.astro`
- `src/pages/catalog/[slug].astro`
- `src/components/products/EpsilonStage.astro`
- `src/components/sections/EpsilonCameo.astro`
- Any `src/scripts/motion/timelines/epsilon*.ts` referenced only by the deleted page (grep before deleting)

## 12. Acceptance criteria

- [ ] `/products` shows a 3-column grid of 13 category cards, each with image, name, blurb, "View products →".
- [ ] Clicking a category card navigates to `/catalog/<slug>`.
- [ ] `/catalog/compression-fittings` shows 3 products (epsilon, coupling-repair, coupling-transition) when country gate not yet picked, or country-scoped subset after pick.
- [ ] `/catalog/polyethylene-pipes` (or any of the 9 empty categories) shows the empty-state message with "Back to all categories" CTA.
- [ ] Sidebar on `/catalog/<category>` shows all 13 categories with the active one highlighted; the existing filter rail is below the categories nav.
- [ ] Filter rail no longer shows a Category facet group.
- [ ] `/catalog/compression-fittings/epsilon` renders the Elysee-style flat detail page (no GSAP cinema).
- [ ] Old URLs (`/catalog`, `/catalog/epsilon`, `/products/epsilon`, etc.) all redirect via Astro's static redirects.
- [ ] Country gate triggers on `/catalog/<category>` and `/catalog/<category>/<product>` (testing-mode: every visit). Not on `/products`.
- [ ] `npm run check`, `npm run test`, `npm run build` all pass.
- [ ] Manual: navigating from `/products` → `/catalog/compression-fittings` → `/catalog/compression-fittings/epsilon` works for all 8 products.
- [ ] Manual: navigating from `/products` → an empty category shows the empty state.
- [ ] All 13 category PNGs ship in `public/images/categories/` and load on `/products`.

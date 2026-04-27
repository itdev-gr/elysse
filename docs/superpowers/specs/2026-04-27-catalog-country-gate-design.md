# Catalog Country Gate (Design Spec)

**Status:** Approved for planning
**Date:** 2026-04-27
**Scope:** Country picker modal on `/catalog`, with country-scoped product list
**Stack:** Astro 5 · Tailwind v4 · MDX · Vitest (existing project)
**Related:** `2026-04-27-products-rs-catalog-demo-design.md`

---

## 1. Background

The RS-style catalog at `/catalog` currently shows all 8 demo products to every visitor. Real B2B distributors gate by country — different SKUs, certifications, and availability per region. To demo this behavior to the client, we add a required country picker that runs once per browser and narrows the catalog to that country's products.

The 3-country list is a **placeholder for the demo** (Country 1, Country 2, Country 3). The mapping to a real country list (and per-country product data) happens after client approval.

## 2. Scope

### 2.1 In scope

- Required, non-dismissible country picker modal on first visit to `/catalog` and `/catalog/[slug]`
- 3 placeholder countries: `country-1`, `country-2`, `country-3`
- Per-product `availableCountries: Country[]` field in MDX frontmatter
- Country-scoped product list throughout `/catalog` (grid, filter rail facet counts, search index, related products)
- "Not available in {country}" notice on `/catalog/[slug]` for products outside the chosen country
- Persistence in `localStorage` (one-time pick, never re-asked unless storage cleared)
- Vitest coverage for storage round-trip, country filter, and integration with the existing filter pipeline

### 2.2 Out of scope

- Re-pick UI in nav (deferred — current scope only sets the country, never changes it from the UI)
- Geo-IP detection or browser-locale auto-pick
- Real country list or flag icons
- Localized labels / copy translation
- Per-country pricing or SKU codes
- Cookie-consent banner interaction
- Cinematic `/products` and `/products/epsilon` — untouched, no modal, full product set

## 3. User flow

1. User lands on `/catalog` (or `/catalog/[slug]`) for the first time.
2. Page server-renders. Country modal markup is in the DOM, hidden.
3. Boot script reads `localStorage.elysee.country`:
   - **Valid value:** modal stays hidden; catalog hydrates scoped to that country.
   - **Missing/invalid:** modal opens, body scroll locks, focus traps inside the panel; catalog hydration is gated until pick.
4. User clicks one of three country buttons. The pick is written to `localStorage`, modal hides, body scroll unlocks, catalog hydrates scoped to the picked country.
5. On every later visit, step 3's "valid value" branch runs; modal does not re-appear.

## 4. Data model

### 4.1 Country type

```ts
// src/scripts/catalog/types.ts
export type Country = 'country-1' | 'country-2' | 'country-3';

export const COUNTRIES: ReadonlyArray<{ id: Country; label: string }> = [
  { id: 'country-1', label: 'Country 1' },
  { id: 'country-2', label: 'Country 2' },
  { id: 'country-3', label: 'Country 3' },
] as const;
```

### 4.2 Product schema additions

`CatalogProduct` gains:

```ts
availableCountries: Country[];   // required; non-empty
```

The Astro content collection schema (Zod) requires the field as a non-empty array of `Country`. A product missing the field, or with `[]`, is a build-time error caught by `astro check`.

### 4.3 Demo distribution

Across the 8 existing products, distributed so each country shows a visibly distinct set with deliberate overlap:

| slug | country-1 | country-2 | country-3 |
|---|---|---|---|
| epsilon | yes | yes | — |
| saddle-clamp | yes | — | yes |
| pvc-ball-valve | yes | — | yes |
| double-union-glued | yes | — | — |
| coupling-repair | yes | — | — |
| adaptor-flanged | — | yes | — |
| single-4-bolts | — | yes | yes |
| coupling-transition | — | yes | — |
| **Total** | **5** | **4** | **3** |

## 5. Modal component

**File:** `src/components/catalog/CountryModal.astro`
**Used in:** `src/pages/catalog/index.astro`, `src/pages/catalog/[slug].astro`

### 5.1 Markup (server-rendered, hidden by default)

```html
<div class="country-modal" data-country-modal hidden
     role="dialog" aria-modal="true" aria-labelledby="country-modal-title">
  <div class="country-modal__backdrop"></div>
  <div class="country-modal__panel">
    <h2 id="country-modal-title">Select your country</h2>
    <p>Product availability varies by region.</p>
    <ul class="country-modal__choices">
      <li><button data-country="country-1">Country 1</button></li>
      <li><button data-country="country-2">Country 2</button></li>
      <li><button data-country="country-3">Country 3</button></li>
    </ul>
    <noscript>Please enable JavaScript to browse the catalog.</noscript>
  </div>
</div>
```

### 5.2 Behavior

- Required. No close button, no overlay click-out, no `Escape` close.
- Body scroll locked while open (`overflow: hidden` on `<html>`).
- Focus moves to the first country button on open; `Tab`/`Shift+Tab` cycle within the panel.
- Buttons are real `<button>`s with visible focus rings.
- Click handler writes to `localStorage` and hides the modal in one synchronous step before catalog hydration runs.

### 5.3 Style

Tailwind utilities scoped under `.catalog-scope` to match existing `catalog.css`. White panel, soft shadow, panel max-width ~28rem, three full-width stacked buttons. No flag icons (placeholders).

## 6. Storage module

**File:** `src/scripts/catalog/country.ts` (new)

```ts
import type { Country } from './types';
import { COUNTRIES } from './types';

const KEY = 'elysee.country';
const VALID: ReadonlySet<Country> = new Set(COUNTRIES.map(c => c.id));

export function readCountry(): Country | null {
  try {
    const v = localStorage.getItem(KEY);
    return v && VALID.has(v as Country) ? (v as Country) : null;
  } catch { return null; }
}

export function writeCountry(c: Country): void {
  try { localStorage.setItem(KEY, c); } catch { /* private mode */ }
}
```

`try/catch` covers Safari private-mode browsers where `localStorage` access throws.

## 7. Filter pipeline integration

Country is a **pre-filter**, not a user-facing facet. It runs before `applyFilters()` and before `deriveFacets()` so that:

- "Reset filters" never clears the country.
- Filter-rail counts reflect only the chosen country's products.
- The search index is built from only the country's products.

### 7.1 New helper

```ts
// src/scripts/catalog/filter-engine.ts
export function byCountry(products: CatalogProduct[], country: Country): CatalogProduct[] {
  return products.filter(p => p.availableCountries.includes(country));
}
```

### 7.2 `Filters` type — unchanged

Country is **not** added to the `Filters` interface, because it is not a clearable facet.

### 7.3 Page init signature

`initCatalogPage` and `initCatalogPageDetail` (in `src/scripts/catalog/page-init.ts` and `page-init-detail.ts`) take `country: Country` and apply `byCountry(all, country)` once at startup. All downstream code paths (`deriveFacets`, search, sort, render) operate on the scoped list.

```ts
const country = readCountry()!;          // boot script guarantees non-null
const all     = parseProductsJson();
const scoped  = byCountry(all, country);
const facets  = deriveFacets(scoped);
// rest of init uses `scoped`
```

## 8. Page-level wiring

### 8.1 `/catalog/index.astro`

Inline boot script (replaces current `go()`):

```ts
import { readCountry, writeCountry } from '~/scripts/catalog/country';
import { initCatalogPage } from '~/scripts/catalog/page-init';
import { initBasketUi } from '~/scripts/catalog/basket-ui';
import { openCountryModal } from '~/scripts/catalog/country-modal';

function go() {
  initBasketUi();
  const country = readCountry();
  if (country) {
    initCatalogPage(country);
  } else {
    openCountryModal((picked) => {
      writeCountry(picked);
      initCatalogPage(picked);
    });
  }
}
```

### 8.2 `/catalog/[slug].astro`

Same gate around `initCatalogPageDetail(country, slug)`. After hydration:

- If `slug` is in the chosen country's product set → render normally.
- If not → render the page (so bookmarks don't 404), but replace the quote/CTA region with: *"This product is not available in {country}."* The Related Products section uses the country-scoped list.

## 9. Edge cases

| Case | Behavior |
|---|---|
| `localStorage` throws (private mode) | `readCountry` returns `null`; modal shows every visit. Catalog still functions. |
| Stored value invalid (manual edit, removed country) | Validation rejects → treated as null; modal opens. |
| Country has zero products after filter | `EmptyResults.astro` reused with copy "No products available in {country}." Won't trigger with seed data. |
| Deep link to product not in country | Page renders, "Not available in {country}" notice replaces quote/CTA. |
| Deep link with URL filter state to `/catalog?sectors=...` | Modal opens first; URL state preserved (read by `initCatalogPage`, gated behind pick). |
| MDX missing `availableCountries` | Build error from content schema; caught by `astro check` in CI. |
| `/products`, `/products/epsilon` (cinematic) | No modal; full product set; out of scope. |
| Quote basket items from before pick | Retained (basket persistence is independent of country). Switching country isn't possible from the UI in current scope, so cross-country basket contamination cannot occur via normal flow. |

## 10. Testing

Add three Vitest specs under `tests/catalog/`:

1. **`country.test.ts`** — `readCountry`/`writeCountry` round-trip; rejects unknown values; returns `null` when `localStorage` getter throws (mock the throw).
2. **`by-country.test.ts`** — given the 8 demo products with the Section 4.3 distribution, each country returns the documented subset; products in multiple countries appear in each respective set.
3. **Extend `tests/catalog/integration.test.ts`** — with `country-3` selected, the rendered grid contains only the 3 expected products, and `deriveFacets` returns counts reflecting only those 3 products.

No visual regression tests; manual smoke covers the modal.

## 11. Files changed

**New:**
- `src/components/catalog/CountryModal.astro`
- `src/scripts/catalog/country.ts`
- `src/scripts/catalog/country-modal.ts` (modal show/hide, focus trap, click handler)
- `tests/catalog/country.test.ts`
- `tests/catalog/by-country.test.ts`

**Modified:**
- `src/scripts/catalog/types.ts` — add `Country`, `COUNTRIES`, `availableCountries` on `CatalogProduct`
- `src/scripts/catalog/filter-engine.ts` — add `byCountry`
- `src/scripts/catalog/page-init.ts` — accept `country` arg, apply `byCountry` at start
- `src/scripts/catalog/page-init-detail.ts` — same; "not available" branch
- `src/pages/catalog/index.astro` — render modal, gate `initCatalogPage` on pick
- `src/pages/catalog/[slug].astro` — render modal, gate `initCatalogPageDetail` on pick
- `src/content/config.ts` — extend products collection schema to require `availableCountries`
- All 8 `src/content/products/*.mdx` — add `availableCountries` per Section 4.3
- `src/styles/catalog.css` — modal styles
- `tests/catalog/integration.test.ts` — extend with country-3 case

## 12. Acceptance criteria

- [ ] First visit to `/catalog` shows the modal blocking the page; product grid is not interactive until a country is picked.
- [ ] Modal cannot be dismissed without picking (no close button, click-outside, or Escape).
- [ ] After pick, the grid shows only that country's products and the filter rail's counts reflect that subset.
- [ ] Reload: modal does not reappear; the same country's products are shown.
- [ ] Clearing `localStorage.elysee.country` and reloading: modal reappears.
- [ ] Switching country in DevTools `localStorage` and reloading: grid reflects the new country.
- [ ] Deep-linking to a product not in the chosen country renders the page with a "Not available in {country}" notice instead of the quote CTA.
- [ ] `/products` and `/products/epsilon` are unchanged — no modal, all 8 products visible.
- [ ] `npm run test` passes including the three new/extended specs.
- [ ] `npm run check` passes.

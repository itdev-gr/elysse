# Products — RS-Style Catalog Demo (Design Spec)

**Status:** Approved for planning
**Date:** 2026-04-27
**Scope:** New `/catalog` namespace — RS Delivers-style B2B catalog demo for client approval
**Stack:** Astro 5 · Tailwind v4 · MDX (existing project)

---

## 1. Background and intent

The client (Elysee Irrigation Ltd., Cyprus, founded 1979, 215+ employees, 65+ countries, 5,000+ product codes across Agriculture, Landscape, Building & Infrastructure, and Industry) currently has a "Cinematic Bold" Awwwards-tier redesign live on `main` — homepage with GSAP scroll choreography, dark forest canvas, Fraunces display type, plus a 5-act Epsilon deep-dive.

The user wants to show the client a **second design direction** for the products section, modelled on RS Delivers (RS Components Greece — gr.rsdelivers.com). The hypothesis: a working B2B catalog (filter rail, dense grid, spec tables, quote basket) is more useful for Elysee's actual sales process than a cinematic showpiece. This spec is the demo for that hypothesis.

If the client approves the new direction after seeing this demo, the style is rolled out across the rest of the site in a follow-up project. If they don't, the cinematic site continues as-is. **Both designs must coexist** in the repo for the comparison.

A future Excel of additional Elysee products will be imported into this catalog. The data model and patterns must scale from 8 demo products to thousands without redesign.

---

## 2. Scope

### 2.1 In scope

- New route namespace `/catalog` for the demo:
  - `/catalog` — index page (RS-style listing)
  - `/catalog/[slug]` — detail page (one per product)
- All 8 existing products from `src/content/products/*.mdx` migrate into the catalog
- Quote-basket UX (hybrid C from Q3): floating pill, drawer with line items + qty pickers, single submit
- Excel-friendly data model: extended product schema, a small import script (CSV/Excel → MDX writer) ready for the later Excel
- Real product photos pulled from `elysee.com.cy/portal-img/...`, real codes (NO330D, NO331B, NO321D, NO550V, NO108F, plus codes added for the missing 3 products), real specs where available

### 2.2 Out of scope (explicitly deferred)

- Anything outside `/catalog` — homepage, `/products`, `/products/epsilon` are **untouched**
- i18n — English only for the demo
- Pricing, stock indicators, real checkout
- Quote form backend (form submission stubs to console + success state)
- Comparison feature
- Server-side search (client-side only)
- Programmatic datasheet PDF generation (link to existing files only; placeholder when missing)
- Auth / accounts
- Excel import execution (the script is built; the actual Excel file lands in a follow-up)

### 2.3 Coexistence rule

Existing routes `/`, `/products`, `/products/epsilon` and all their visuals, motion, and behavior **must not regress**. New work lives under:
- `src/pages/catalog/` (new)
- `src/components/catalog/` (new)
- `src/styles/catalog.css` (new — scoped tokens for the catalog skin)
- `src/scripts/catalog/` (new — basket store, filter logic)
- `src/content/products/` schema **extends** (additive only; existing fields stay)

The only edits to existing files allowed in this project are:
1. **Global header** — add one nav link `Catalog (preview)` next to `Products`. No restructure.
2. **`src/content/config.ts`** — additive schema fields only (see §5.1).
3. **8 existing product MDX files** — additive frontmatter only (new fields), body content unchanged.
4. **README** — append a one-line note about `/catalog`.

A user who arrives at `/` sees the cinematic site. A user who arrives at `/catalog` sees the RS-style demo. The two coexist for client comparison.

---

## 3. Visual identity

**Direction:** RS Delivers' information architecture, Elysee's skin on a light cream surface.

### 3.1 Palette (catalog-only tokens)

Existing tokens stay untouched; new tokens are added in `src/styles/catalog.css` and only used inside `/catalog` routes.

| Token | Hex | Role |
|---|---|---|
| `--cat-surface` | `#f6f1e6` | Page canvas (warm cream, descended from existing `--surface-break #f2ede3`) |
| `--cat-surface-raised` | `#ffffff` | Cards, filter rail panels, drawer |
| `--cat-surface-sunken` | `#ece5d4` | Section dividers, table zebra |
| `--cat-ink` | `#0a1410` | Primary text (matches existing `--surface-deep` for ink) |
| `--cat-ink-muted` | `#52635a` | Secondary text, helper copy |
| `--cat-ink-subtle` | `#8a958e` | Captions, counts, placeholders |
| `--cat-accent` | `#3d6b52` | Primary CTA, links, active filter (existing `--accent-deep`) |
| `--cat-accent-bright` | `#7eb08c` | Hover, focus ring (existing `--accent-primary`) |
| `--cat-hairline` | `rgba(10,20,16,0.10)` | Borders, table grid, dividers |
| `--cat-hairline-strong` | `rgba(10,20,16,0.18)` | Card outlines, button borders |

All text combinations must clear WCAG AA (≥ 4.5:1 for body, ≥ 3:1 for large text).

### 3.2 Typography (catalog-only)

Catalog deliberately uses fewer fonts than the cinematic site for scanability:

| Role | Family | Notes |
|---|---|---|
| Product titles, page H1 | **Fraunces** (existing) | 22-32px on cards, 40-56px on detail. The only place serif appears in the catalog. |
| All other UI | **Inter Tight** (existing) | 14-16px body, 12-13px chrome, 600 for emphasis |
| Codes, specs, units, labels | **JetBrains Mono** (existing) | 11-13px, letter-spacing 0.04em, used heavily in spec tables and on cards |

No new fonts. Display ramp tightens — RS-style catalogs reward density, not drama.

### 3.3 Density and rhythm

- 12-col grid, 24px gutters, 1280px max-width container (tighter than the cinematic 1440 — RS uses content-dense layouts)
- 8px base rhythm continues
- Section padding: 64 / 48 / 32 (desktop / tablet / mobile) — half the cinematic vertical breathing room
- Cards: 1px hairline border, 4px radius, hover lifts to `--cat-surface-raised` shadow `0 4px 16px rgba(10,20,16,0.06)`
- Tables: hairline grid, zebra rows on `--cat-surface-sunken`, mono numerals

### 3.4 Imagery

- Product photos pulled from `elysee.com.cy/portal-img/default/246/*.jpg` (verified URLs)
- Square aspect ratio in cards, contained on white card surface
- For products without a real Elysee photo (Epsilon, Saddle Clamp, PVC Ball Valve), reuse existing local placeholder SVGs from `public/images/products/`

---

## 4. Information architecture

### 4.1 `/catalog` (index page)

Top to bottom:

1. **Header (existing global header)** — unchanged. New link `Catalog (preview)` added.
2. **Catalog hero strip** — single horizontal band, 120px tall.
   - Left: page title `Catalog` (Fraunces, 40px), eyebrow `Products / Catalog (preview)` (mono, 11px)
   - Right: prominent **search input** (350px wide, mono placeholder `Search by code, name, or spec…`)
3. **Sticky utility bar** — sticks to top of viewport on scroll, below the global header.
   - Left: breadcrumbs `Home / Catalog`
   - Center: results count `Showing 8 of 8 products`
   - Right: sort dropdown (`Most relevant` / `Name A–Z` / `Pressure (high to low)` / `Newest`), view toggle (grid / list), pagination (when > 24 products)
4. **Two-column body**
   - **Left filter rail** (260px, sticky on desktop, drawer on mobile):
     - Filter groups in order: **Sector**, **Category**, **Material**, **DN size** (range), **PN pressure** (range), **Standards**, **Has datasheet**, **BIM available**
     - Each group: collapsible, default expanded for first 3
     - Checkboxes with counts: `[ ] Agriculture (4)`
     - For long lists: `Show 5 more ▾`
     - For numeric ranges (DN, PN): dual-handle slider with mono numeric labels
     - **Option lists derived from product data** at build time: Sector and Category use the schema enums; Material and Standards use the union of distinct strings across all products (sorted alphabetically); DN range uses min/max of `dnRange` tuples across products; PN range uses min/max of `pnRating`. The filter rail rebuilds automatically when the Excel imports more products.
     - Top of rail: `Clear all` link (only when filters active), and active-filter chips that can be dismissed individually
   - **Right results area**: grid view default
     - Grid: 3 columns desktop / 2 tablet / 1 mobile
     - Each card: image (square, white background), product code (mono, 11px), name (Fraunces, 22px), 2-line description (Inter Tight, 13px, muted), key spec chips (`PN 16` `DN 20–110` `POM`), `Add to quote` button (ghost) + `View →` text link
     - List view alternative: same fields horizontal, image left (120px), CTAs right
5. **Footer (existing global footer)** — unchanged.

### 4.2 `/catalog/[slug]` (detail page)

Top to bottom:

1. **Header** — unchanged
2. **Breadcrumbs row** — `Home / Catalog / [Category] / [Product Name]`
3. **Hero block** (two columns desktop, stacked mobile):
   - **Left (60%):** product gallery — main image + thumbnail strip (single image fine for demo)
   - **Right (40%, sticky on scroll):**
     - Product code (mono, 11px, muted)
     - Name (Fraunces, 48px)
     - 2-line description
     - **Key specs strip** — 4 stat blocks in a 2×2 grid: Pressure / Size range / Material / Standard
     - **Primary CTA:** `Add to quote` (filled `--cat-accent`)
     - **Secondary:** `Download datasheet` (link with PDF icon), `View BIM` (when `bim: true`)
     - **For Epsilon only:** tertiary link `Discover the technology →` linking to existing `/products/epsilon` (the cinematic deep-dive lives on; we just link to it from the catalog detail)
4. **Tab block** — sticky tab bar, content swap on click (no page reload):
   - **Specifications** (default): full spec table — every key/value from the MDX `specs[]`, mono values, hairline grid
   - **Standards & Approvals**: list of `standards[]` with logo placeholders
   - **Installation**: notes from `installation` MDX field (string), or empty state `Installation guide coming soon`
   - **Related products**: 4-card row pulled by category match, then sector match
5. **Bottom CTA band** — `Need this in your project?` headline + `Request a quote` (large) + `Talk to engineering` (ghost link to contact)
6. **Footer** — unchanged

### 4.3 Quote basket

- **Floating pill** (bottom-right, fixed): `🛒 Quote (3)` — visible whenever basket > 0 items, only on `/catalog/*` routes
- Click opens **drawer** (right side, 420px desktop / full-width mobile):
  - Header: `Quote request (3 items)` + close X
  - Item rows: thumbnail (60px) · code (mono) · name · qty input (1-99) · remove (×)
  - Bottom: `Continue browsing` (ghost) + `Send quote request` (filled, accent)
- Click `Send quote request` → form view inside the drawer (replaces line items):
  - Fields: Name (required), Company, Email (required), Phone, Project notes (textarea, optional)
  - Submit button: `Send request`
  - On submit: POST to `/api/quote` (Astro endpoint that **logs to console and returns 200**), drawer transitions to success state: `Thanks. We'll be in touch within one business day.` Basket clears.
- State: persisted in `localStorage` under key `elysee.catalog.quote.v1`; restored on page load
- Capacity: max 50 items (silent cap, with toast `Quote basket is full` if exceeded)

### 4.4 Search

- Client-side only. Builds an index at build time of `name`, `code`, `description`, `specs[].value` for all products
- Input on hero: debounced 200ms; updates results inline (does not navigate)
- Empty state: `No products match "[query]". Try fewer filters or a different term.`

### 4.5 Filter behavior

- All filters AND'd (intersection). Within a single facet group, OR'd (union of selections).
- Filter state encoded in URL query string: `?sector=agriculture,industry&pn=16&dn=20-110` — shareable links, back button works
- On filter change: result list re-renders; product count in utility bar updates; active-filter chip row appears under the bar
- Empty state: `No products match these filters. [Clear all].`

---

## 5. Data model

### 5.1 Schema extension

`src/content/config.ts` extends the `products` collection. Existing fields stay; new fields are additive with safe defaults so existing MDX files don't break.

```ts
const products = defineCollection({
  type: 'content',
  schema: z.object({
    // — existing fields, unchanged —
    name: z.string(),
    category: z.enum([
      'compression-fittings', 'pvc-ball-valves', 'saddles',
      'adaptor-flanged', 'couplings', 'valves'
    ]),
    blurb: z.string(),
    pressure: z.string(),
    sizeRange: z.string(),
    featured: z.boolean().default(false),
    image: z.string(),
    specs: z.array(z.object({ key: z.string(), value: z.string() })).default([]),
    bim: z.boolean().default(false),
    datasheet: z.string().optional(),

    // — new fields for the catalog —
    code: z.string().optional(),                                // e.g. "NO330D" — required for catalog, optional for back-compat
    sectors: z.array(z.enum([
      'agriculture', 'landscape', 'building', 'industry'
    ])).default([]),
    material: z.string().optional(),                            // e.g. "POM body / EPDM seal"
    dnRange: z.tuple([z.number(), z.number()]).optional(),      // e.g. [20, 110] for filter
    pnRating: z.number().optional(),                            // e.g. 16 for filter
    standards: z.array(z.string()).default([]),                 // e.g. ["ISO 17885", "WRAS", "KIWA"]
    imageUrls: z.array(z.string()).default([]),                 // gallery — falls back to `image` when empty
    installation: z.string().optional()                         // markdown for the Installation tab
  })
});
```

### 5.2 Migrating the 8 existing products

Each existing MDX gets the new fields populated from elysee.com.cy data plus sensible defaults:

| Slug | Code | Sectors | Image source |
|---|---|---|---|
| `epsilon` | `EPS-PE-001` (Elysee doesn't publish a single code for the series — synthesized) | agriculture, landscape | local placeholder SVG (existing) |
| `adaptor-flanged` | `NO330D` | building, industry | elysee.com.cy CDN |
| `coupling-repair` | `NO331B` | agriculture, building | elysee.com.cy CDN |
| `coupling-transition` | `NO321D` | agriculture, landscape, building | elysee.com.cy CDN |
| `single-4-bolts` | `NO550V` | agriculture, landscape | elysee.com.cy CDN |
| `double-union-glued` | `NO108F` | building, industry | elysee.com.cy CDN |
| `pvc-ball-valve` | `PVC-BV-50` (synthesized) | building, landscape | local placeholder SVG (existing) |
| `saddle-clamp` | `SDL-CL-32` (synthesized) | agriculture, landscape, industry | local placeholder SVG (existing) |

Synthesized codes are flagged with a comment in the MDX file.

### 5.3 Excel import (script, no UI)

`scripts/catalog/import-excel.ts` (run via `node scripts/catalog/import-excel.ts <path-to-xlsx>`):
- Reads xlsx with `xlsx` npm package (added as devDependency)
- Expected columns (header row, case-insensitive): `code, name, category, sectors, material, dn_min, dn_max, pn, blurb, specs (json), standards (csv), image_url, datasheet_url, bim, featured`
- Writes one MDX file per row to `src/content/products/` using slugified code as filename
- Idempotent: if a file already exists for the slug, prompts to overwrite (CLI flag `--force` to skip prompt)
- Validates required columns; reports row-level errors without failing the whole import
- Not run in CI; manual operator step

This script is built but unused until the actual Excel arrives.

---

## 6. Component decomposition

`src/components/catalog/` (one file per component):

- `CatalogHero.astro` — title + search input, top of index
- `UtilityBar.astro` — sticky breadcrumbs + sort + view toggle + count
- `FilterRail.astro` — sticky left rail; renders filter groups
- `FilterGroup.astro` — collapsible facet group (checkboxes or range)
- `RangeFilter.astro` — dual-handle slider (DN, PN)
- `ActiveFilters.astro` — dismissible chip row
- `ProductGrid.astro` — wraps cards, handles grid/list mode
- `ProductCard.astro` — grid card variant
- `ProductRow.astro` — list view variant
- `Pagination.astro` — numbered pagination + page-size select
- `EmptyResults.astro` — empty/no-match state
- `DetailHero.astro` — gallery + sticky info column
- `KeySpecs.astro` — 4-stat grid
- `SpecTable.astro` — full spec key/value table
- `TabBar.astro` — sticky detail tabs + content router
- `RelatedProducts.astro` — 4-card row
- `QuoteBasket.astro` — floating pill + drawer
- `QuoteForm.astro` — drawer form + submission
- `BasketStore.ts` — vanilla JS store (subscribe / publish), localStorage-backed

`src/scripts/catalog/`:
- `filter-engine.ts` — applies filter+search+sort to product list, URL-sync
- `basket.ts` — singleton wrapping `BasketStore`, used by all CTAs
- `mini-search.ts` — tiny client-side search (no library — string-includes over the indexed fields is fast enough at < 1000 products; revisit when index size grows)

`src/pages/catalog/`:
- `index.astro` — index page; imports `CatalogHero`, `UtilityBar`, `FilterRail`, `ProductGrid`
- `[...slug].astro` — detail page; uses `getStaticPaths` over the products collection
- `quote.json.ts` — POST endpoint that logs payload server-side and returns `{ ok: true }` (real backend wiring is out of scope)

`src/styles/catalog.css` — catalog-only token layer + utility classes; imported only by catalog pages.

---

## 7. Key interaction details

### 7.1 "Add to quote" button states

| State | Appearance | Behavior |
|---|---|---|
| Default | Filled `--cat-accent`, white text, label `Add to quote` | Click adds to basket, transitions to "Added" state |
| Added | Outlined accent, label `In quote ✓`, qty `−/+` controls inline | Persists; clicking `−` to 0 removes |
| Disabled (basket at 50-item cap) | Opacity 0.4, cursor not-allowed, tooltip `Quote basket is full` | No-op on click |

### 7.2 Sticky behavior

- Global header: position sticky, existing
- Utility bar (catalog index): sticks below global header on scroll
- Filter rail: sticky within results area on desktop, max-height = viewport − header − utility-bar
- Detail page info column (desktop): sticky, max-height = viewport − header

### 7.3 Mobile filter drawer

- "Filters (3)" button replaces the rail at < 768px
- Click opens full-screen drawer from left
- Drawer header: `Filters` + close X + clear-all
- Drawer footer: `Show 8 results` filled CTA (closes drawer, applies filters)
- Body scrolls inside drawer

### 7.4 Animation

- Catalog uses minimal motion: 150ms ease for filter chip add/remove, hover lift on cards, drawer slide-in (200ms ease-out)
- No GSAP, no scroll-pinned scenes, no OGL canvas — the catalog is a working tool, not a showpiece. (This is a deliberate contrast with the cinematic homepage, which keeps all its motion.)
- Reduced-motion: all transitions clip to 0ms, respecting existing `prefers-reduced-motion` audit

### 7.5 Accessibility

- All filter groups: `<fieldset>` + `<legend>` semantics
- Range sliders: keyboard arrows step, `aria-valuemin/max/now`, mono numeric labels live-update
- Sticky tab bar: `role="tablist"`, focus-visible ring (existing token)
- Quote drawer: `role="dialog"`, focus trapped while open, ESC closes, returns focus to opener
- Cards: full card is a link (`<a>` wraps card except the `Add to quote` button which has its own `<button>` with `stopPropagation`)
- Color contrast: every chrome combination tested against AA before merge

---

## 8. Performance

- Index page renders all products at build time (Astro static); filter/search runs client-side over the pre-rendered list
- At 8 products, the entire catalog data inlines as JSON < 5kb. Designed to scale to ~5,000 — at that point we revisit (likely paginate before client-render)
- Images: lazy-loaded except first 6 cards above the fold; `srcset` for elysee.com.cy images using their CDN's resize params if available, else native sizes
- No new heavy dependencies. `xlsx` is a devDependency only (build excludes it)
- Lighthouse target: ≥ 95 performance / 100 accessibility on `/catalog`

---

## 9. Testing

- **Vitest unit tests** (extend existing test setup):
  - `filter-engine.test.ts` — single-facet filter, multi-facet AND, range filter, search query, URL encoding/decoding round-trip
  - `basket.test.ts` — add, increment, remove, persist to localStorage, restore, capacity cap
  - `mini-search.test.ts` — match by code, name, spec value, no-match returns empty
- **Code-level browser smoke** (existing pattern in repo): a Vitest test that mounts `/catalog` against jsdom, asserts result count, applies a filter, asserts new count, opens basket, asserts pill visible
- Existing tests must still pass — no regression in cinematic site
- Build must pass `astro check && tsc --noEmit`

---

## 10. Acceptance criteria

The demo is ready to show the client when:

1. `/catalog` renders the 8 products with real photos (where available) and real codes
2. The filter rail filters correctly across at least 3 facet types (sector, category, range)
3. Search finds a product by code (e.g. `NO330D` → 1 result)
4. View toggle switches between grid and list without page reload
5. Detail page renders for all 8 products with spec table and CTAs
6. Quote basket adds, persists across reloads, opens drawer, submits form, shows success
7. Epsilon detail page links to existing `/products/epsilon` cinematic page
8. Existing `/`, `/products`, `/products/epsilon` look and behave exactly as they do on `main`
9. Build is green, all tests pass, Lighthouse is in the target range
10. README updated with a one-line note: catalog demo lives at `/catalog`

---

## 11. Open questions

None at spec time. Items deferred to implementation:
- Exact hero search width at sub-tablet breakpoints — set during visual QA
- Whether elysee.com.cy product images need a CORS-friendly proxy or local mirror — first try direct embed, fall back to mirroring under `public/images/products/elysee/` if the headers block it


# Excel Coupling Import — Country-Aware SKU Table

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import the first 10 rows from sheet "A-(Black & Blue)" of `Excel Catalogue APRIL 2026 for Marios (1).xlsm` as a new "Coupling — Epsilon Series PN16" product, with a SKU table that shows country-conditional codes (Elysée code 331… for Country 1, Rohrsysteme code 381…M for Country 2) and a country-conditional product image. Country selection drives both.

**Architecture:** Extend the existing `SkuRow` type to carry both codes per row plus MOQ + NPT. Render both codes in each `<td>` and let CSS hide the inactive one based on a `data-active-country` attribute on the catalog-detail root. Same pattern for the product image (two `<img>`s, CSS toggles). The country-modal callback in `page-init-detail.ts` sets `data-active-country` on the root.

**Tech Stack:** Astro 5 · Tailwind v4 · MDX · TypeScript · vanilla DOM.

---

## File overview

**New:**
- `src/content/products/coupling-epsilon-pn16.mdx` — new product in `compression-fittings`
- `public/images/products/coupling-epsilon-pn16-elysee.svg` — Country-1 placeholder
- `public/images/products/coupling-epsilon-pn16-rohrsysteme.svg` — Country-2 placeholder

**Modified:**
- `src/scripts/catalog/sku-tables.ts` — extended `SkuRow` shape (code1/code2/moq/npt) + 10 rows for new product
- `src/components/catalog/SkuTable.astro` — render code1+code2 cells, MOQ + NPT columns; CSS-driven country toggle
- `src/components/catalog/DetailHero.astro` — render two product images (Country 1 / Country 2), CSS toggles
- `src/scripts/catalog/page-init-detail.ts` — set `data-active-country={country}` on the detail root after pick
- `src/styles/catalog.css` — CSS rules that hide elements with `data-country` not matching the active country

---

## Pre-extracted SKU rows (from Excel sheet "A-(Black & Blue)" rows 5–14)

```ts
[
  { code1: '331016016', code2: '381016016M', size: '16 x 16',   bag: 25, box: 525, moq: 0, npt: 0 },
  { code1: '331020020', code2: '381020020M', size: '20 x 20',   bag: 15, box: 315, moq: 0, npt: 0 },
  { code1: '331025025', code2: '381025025M', size: '25 x 25',   bag: 15, box: 225, moq: 0, npt: 0 },
  { code1: '331032032', code2: '381032032M', size: '32 x 32',   bag: 10, box: 120, moq: 0, npt: 0 },
  { code1: '331040040', code2: '381040040M', size: '40 x 40',   bag: 0,  box: 72,  moq: 0, npt: 0 },
  { code1: '331050050', code2: '381050050M', size: '50 x 50',   bag: 0,  box: 44,  moq: 0, npt: 0 },
  { code1: '331063063', code2: '381063063M', size: '63 x 63',   bag: 0,  box: 30,  moq: 0, npt: 0 },
  { code1: '331075075', code2: '381075075M', size: '75 x 75',   bag: 0,  box: 16,  moq: 0, npt: 0 },
  { code1: '331090090', code2: '381090090M', size: '90 x 90',   bag: 0,  box: 10,  moq: 0, npt: 0 },
  { code1: '331110110', code2: '381110110M', size: '110 x 110', bag: 0,  box: 5,   moq: 0, npt: 0 }
]
```

Display rule: render `0` values as blank (Excel uses 0 to mean "no value" for these columns).

---

## Task 1: Extend SkuRow + import 10 rows + add product MDX

**Files:**
- Modify: `src/scripts/catalog/sku-tables.ts`
- Create: `src/content/products/coupling-epsilon-pn16.mdx`
- Create: `public/images/products/coupling-epsilon-pn16-elysee.svg`
- Create: `public/images/products/coupling-epsilon-pn16-rohrsysteme.svg`

The existing `coupling-transition` SKU data uses a single `code` field. Keep it backwards-compatible by making `code1`/`code2` optional alongside the legacy `code`.

- [ ] **Step 1: Extend the SkuRow type and add the new product data**

Replace the contents of `src/scripts/catalog/sku-tables.ts` with:

```ts
// Hardcoded SKU tables per product. Demo-only.

export interface SkuRow {
  /** Legacy single-code field (used by coupling-transition demo). */
  code?: string;
  /** Country-1 (Elysée) code. Preferred over `code` when present. */
  code1?: string;
  /** Country-2 (Rohrsysteme) code. Preferred over `code` when present. */
  code2?: string;
  size: string;
  box?: number | string;
  bag?: number | string;
  moq?: number | string;
  npt?: number | string;
  note?: string;
}

const TABLES: Record<string, SkuRow[]> = {
  'coupling-transition': [
    { code: '330001601', size: 'Ø 16 x ½"',  box: 750, bag: 25 },
    { code: '330001602', size: 'Ø 16 x ¾"',  box: 750, bag: 25 },
    { code: '330001610', size: 'Ø 16 x ⅜"',  box: 750, bag: 25 },
    { code: '330002001', size: 'Ø 20 x ½"',  box: 500, bag: 25 },
    { code: '330002002', size: 'Ø 20 x ¾"',  box: 500, bag: 25 },
    { code: '330002003', size: 'Ø 20 x 1"',  box: 450, bag: 25 },
    { code: '330002501', size: 'Ø 25 x ½"',  box: 360, bag: 20 },
    { code: '330002502', size: 'Ø 25 x ¾"',  box: 320, bag: 20 },
    { code: '330002503', size: 'Ø 25 x 1"',  box: 320, bag: 20 },
    { code: '330003201', size: 'Ø 32 x ½"',  box: 180, bag: 10 },
    { code: '330003202', size: 'Ø 32 x ¾"',  box: 180, bag: 10 },
    { code: '330003203', size: 'Ø 32 x 1"',  box: 180, bag: 10, note: '▲' },
    { code: '330003204', size: 'Ø 32 x 1¼"', box: 180, bag: 10, note: '▲' },
    { code: '330003205', size: 'Ø 32 x 1½"', box: 150, bag: 10 },
    { code: '330004003', size: 'Ø 40 x 1"',  box: 100 },
    { code: '330004004', size: 'Ø 40 x 1¼"', box: 100, note: '▲' },
    { code: '330004005', size: 'Ø 40 x 1½"', box: 100, note: '▲' }
  ],
  'coupling-epsilon-pn16': [
    { code1: '331016016', code2: '381016016M', size: '16 x 16',   bag: 25, box: 525, moq: 0, npt: 0 },
    { code1: '331020020', code2: '381020020M', size: '20 x 20',   bag: 15, box: 315, moq: 0, npt: 0 },
    { code1: '331025025', code2: '381025025M', size: '25 x 25',   bag: 15, box: 225, moq: 0, npt: 0 },
    { code1: '331032032', code2: '381032032M', size: '32 x 32',   bag: 10, box: 120, moq: 0, npt: 0 },
    { code1: '331040040', code2: '381040040M', size: '40 x 40',   bag: 0,  box: 72,  moq: 0, npt: 0 },
    { code1: '331050050', code2: '381050050M', size: '50 x 50',   bag: 0,  box: 44,  moq: 0, npt: 0 },
    { code1: '331063063', code2: '381063063M', size: '63 x 63',   bag: 0,  box: 30,  moq: 0, npt: 0 },
    { code1: '331075075', code2: '381075075M', size: '75 x 75',   bag: 0,  box: 16,  moq: 0, npt: 0 },
    { code1: '331090090', code2: '381090090M', size: '90 x 90',   bag: 0,  box: 10,  moq: 0, npt: 0 },
    { code1: '331110110', code2: '381110110M', size: '110 x 110', bag: 0,  box: 5,   moq: 0, npt: 0 }
  ]
};

export function skuTableRowsForProduct(slug: string): SkuRow[] {
  return TABLES[slug] ?? [];
}
```

- [ ] **Step 2: Create the new product MDX**

Create `src/content/products/coupling-epsilon-pn16.mdx`:

```mdx
---
name: Coupling — Epsilon Series PN16
categorySlug: compression-fittings
blurb: Epsilon Series PN16 compression coupling. Available in 10 sizes (Ø16 to Ø110), branded as Elysée (No. 331) and Rohrsysteme (No. 381).
pressure: 16 bar
sizeRange: Ø16–Ø110
featured: false
image: /images/products/coupling-epsilon-pn16-elysee.svg
code: ''
sectors: [agriculture, landscape, building]
material: PP body / EPDM seal
dnRange: [16, 110]
pnRating: 16
standards: [ISO 17885, WRAS]
imageUrls:
  - /images/products/coupling-epsilon-pn16-elysee.svg
availableCountries: [country-1, country-2]
---

Compression coupling for PE pipes. Quick-fit re-usable system. Brand name varies by region: Elysée (No. 331) or Rohrsysteme (No. 381).
```

- [ ] **Step 3: Create two placeholder SVGs**

Create `public/images/products/coupling-epsilon-pn16-elysee.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#ffffff"/>
  <circle cx="200" cy="200" r="120" fill="none" stroke="#3d6b52" stroke-width="6"/>
  <circle cx="200" cy="200" r="80" fill="none" stroke="#3d6b52" stroke-width="3"/>
  <text x="200" y="60" font-family="system-ui, sans-serif" font-size="22" font-weight="600" fill="#3d6b52" text-anchor="middle">Elysée</text>
  <text x="200" y="350" font-family="ui-monospace, monospace" font-size="16" fill="#52635a" text-anchor="middle">No. 331 Coupling</text>
</svg>
```

Create `public/images/products/coupling-epsilon-pn16-rohrsysteme.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#ffffff"/>
  <circle cx="200" cy="200" r="120" fill="none" stroke="#0a4570" stroke-width="6"/>
  <circle cx="200" cy="200" r="80" fill="none" stroke="#0a4570" stroke-width="3"/>
  <text x="200" y="60" font-family="system-ui, sans-serif" font-size="22" font-weight="600" fill="#0a4570" text-anchor="middle">Rohrsysteme</text>
  <text x="200" y="350" font-family="ui-monospace, monospace" font-size="16" fill="#52635a" text-anchor="middle">No. 381 Coupling</text>
</svg>
```

- [ ] **Step 4: Verify**

Run: `cd /Users/marios/Desktop/Cursor/elysse && npm run check && npm run test`
Expected: PASS — Astro reads the new MDX, all tests still green.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/catalog/sku-tables.ts src/content/products/coupling-epsilon-pn16.mdx public/images/products
git commit -m "feat(catalog): import coupling-epsilon-pn16 product with 10 SKU rows"
```

---

## Task 2: Update SkuTable to render country-conditional codes + MOQ + NPT

**Files:**
- Modify: `src/components/catalog/SkuTable.astro`
- Modify: `src/styles/catalog.css`

The table now renders BOTH codes in the same `<td>` (one per `<span data-country>`) and lets CSS hide the inactive one. New columns: MOQ, NPT. Hide MOQ/NPT entirely when no row in the table has them.

- [ ] **Step 1: Replace the SkuTable component**

Replace `src/components/catalog/SkuTable.astro` with:

```astro
---
import type { SkuRow } from '~/scripts/catalog/sku-tables';
interface Props {
  rows: SkuRow[];
  title?: string;
}
const { rows, title = 'Available sizes' } = Astro.props;

const hasCountrySplit = rows.some(r => r.code1 || r.code2);
const hasMoq = rows.some(r => r.moq !== undefined && String(r.moq) !== '0' && r.moq !== '');
const hasNpt = rows.some(r => r.npt !== undefined && String(r.npt) !== '0' && r.npt !== '');
const hasNote = rows.some(r => r.note);

function display(v: number | string | undefined): string {
  if (v === undefined) return '';
  if (v === 0 || v === '0') return '';
  return String(v);
}
---
{rows.length > 0 && (
  <section class="sku-table-wrap mt-2">
    {title && <h3 class="cat-mono text-[11px] uppercase tracking-wider text-[var(--cat-ink-muted)] mb-2">{title}</h3>}
    <div class="overflow-x-auto border border-[var(--cat-hairline)] rounded-md">
      <table class="sku-table w-full text-sm">
        <thead>
          <tr>
            <th rowspan="2" class="px-3 py-2 text-center">Code</th>
            <th rowspan="2" class="px-3 py-2 text-center">Size</th>
            <th colspan="2" class="px-3 py-1 text-center border-b border-white/30">Packing (pcs)</th>
            {hasMoq && <th rowspan="2" class="px-3 py-2 text-center">MOQ</th>}
            {hasNpt && <th rowspan="2" class="px-3 py-2 text-center">NPT</th>}
            {hasNote && <th rowspan="2" class="px-3 py-2 text-center">Note</th>}
          </tr>
          <tr>
            <th class="px-3 py-1 text-center font-normal">Box</th>
            <th class="px-3 py-1 text-center font-normal">Bag</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr class={i % 2 === 1 ? 'bg-[var(--cat-surface-sunken)]' : ''}>
              <td class="px-3 py-1.5 text-center cat-mono">
                {hasCountrySplit ? (
                  <>
                    <span data-country="country-1">{r.code1 ?? ''}</span>
                    <span data-country="country-2">{r.code2 ?? ''}</span>
                  </>
                ) : (r.code ?? '')}
              </td>
              <td class="px-3 py-1.5 text-center">{r.size}</td>
              <td class="px-3 py-1.5 text-center">{display(r.box)}</td>
              <td class="px-3 py-1.5 text-center">{display(r.bag)}</td>
              {hasMoq && <td class="px-3 py-1.5 text-center">{display(r.moq)}</td>}
              {hasNpt && <td class="px-3 py-1.5 text-center">{display(r.npt)}</td>}
              {hasNote && <td class="px-3 py-1.5 text-center">{r.note ?? ''}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
)}

<style is:global>
  .sku-table thead tr th {
    background: var(--cat-accent);
    color: var(--cat-surface-raised);
    font-family: 'Inter Tight', system-ui, sans-serif;
    font-weight: 600;
    font-size: 12px;
    border-color: rgba(255, 255, 255, 0.3);
  }
  .sku-table tbody tr {
    border-bottom: 1px solid var(--cat-hairline);
  }
  .sku-table tbody tr:last-child {
    border-bottom: none;
  }
</style>
```

- [ ] **Step 2: Append country-toggle CSS rules to `src/styles/catalog.css`**

Append at the bottom of `src/styles/catalog.css`:

```css
/* Country-conditional content: only the matching country's elements are visible.
 * Defaults to showing country-1 server-side; JS sets data-active-country on
 * the catalog-detail root after the country is picked. */
[data-catalog-detail] [data-country="country-1"] { display: inline; }
[data-catalog-detail] [data-country="country-2"],
[data-catalog-detail] [data-country="country-3"] { display: none; }

[data-catalog-detail][data-active-country="country-2"] [data-country="country-1"] { display: none; }
[data-catalog-detail][data-active-country="country-2"] [data-country="country-2"] { display: inline; }

[data-catalog-detail][data-active-country="country-3"] [data-country="country-1"] { display: none; }
[data-catalog-detail][data-active-country="country-3"] [data-country="country-3"] { display: inline; }

/* Image variants are block, not inline. */
[data-catalog-detail] img[data-country="country-1"] { display: block; }
[data-catalog-detail] img[data-country="country-2"],
[data-catalog-detail] img[data-country="country-3"] { display: none; }
[data-catalog-detail][data-active-country="country-2"] img[data-country="country-1"] { display: none; }
[data-catalog-detail][data-active-country="country-2"] img[data-country="country-2"] { display: block; }
[data-catalog-detail][data-active-country="country-3"] img[data-country="country-1"] { display: none; }
[data-catalog-detail][data-active-country="country-3"] img[data-country="country-3"] { display: block; }
```

- [ ] **Step 3: Verify**

Run: `npm run check && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/catalog/SkuTable.astro src/styles/catalog.css
git commit -m "feat(catalog): SkuTable supports country-conditional codes, MOQ, NPT"
```

---

## Task 3: DetailHero renders country-conditional product image

**Files:**
- Modify: `src/components/catalog/DetailHero.astro`

The hero gallery's main image and any thumbnails get tagged with `data-country` so CSS toggles them per country. We add a `productImagesByCountry` lookup keyed by slug — for products without per-country images, fall back to the existing single image.

- [ ] **Step 1: Add the lookup module and update DetailHero**

Replace `src/components/catalog/DetailHero.astro` with:

```astro
---
import type { CatalogProduct } from '~/scripts/catalog/types';
import KeySpecs from './KeySpecs.astro';
import SkuTable from './SkuTable.astro';
import { skuTableRowsForProduct } from '~/scripts/catalog/sku-tables';

interface Props { product: CatalogProduct; }
const { product: p } = Astro.props;

interface ImagesByCountry {
  'country-1': string;
  'country-2': string;
  'country-3'?: string;
}
const PER_COUNTRY_IMAGES: Record<string, ImagesByCountry> = {
  'coupling-epsilon-pn16': {
    'country-1': '/images/products/coupling-epsilon-pn16-elysee.svg',
    'country-2': '/images/products/coupling-epsilon-pn16-rohrsysteme.svg'
  }
};

const fallback = p.imageUrls[0] ?? p.image;
const perCountry = PER_COUNTRY_IMAGES[p.slug];
const skuRows = skuTableRowsForProduct(p.slug);
---
<section class="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
  <div class="lg:col-span-7">
    <div class="bg-white border border-[var(--cat-hairline)] rounded-md aspect-square flex items-center justify-center">
      {perCountry ? (
        <>
          <img src={perCountry['country-1']} data-country="country-1" alt={p.name} width="800" height="800" class="max-w-full max-h-full object-contain p-8" />
          <img src={perCountry['country-2']} data-country="country-2" alt={p.name} width="800" height="800" class="max-w-full max-h-full object-contain p-8" />
          {perCountry['country-3'] && <img src={perCountry['country-3']} data-country="country-3" alt={p.name} width="800" height="800" class="max-w-full max-h-full object-contain p-8" />}
        </>
      ) : (
        <img src={fallback} alt={p.name} width="800" height="800" class="max-w-full max-h-full object-contain p-8" />
      )}
    </div>
    {!perCountry && p.imageUrls.length > 1 && (
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
    {skuRows.length > 0 && <SkuTable rows={skuRows} title="Available sizes" />}
    <div class="flex flex-col gap-2 mt-2">
      <button data-add-to-quote data-slug={p.slug} data-name={p.name} data-code={p.code ?? ''} data-thumb={fallback} class="cat-btn cat-btn--primary">Add to quote</button>
      {p.datasheet && <a href={p.datasheet} class="cat-btn cat-btn--ghost"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v4h16v-4"/></svg>Download datasheet</a>}
      {p.bim && <a href="https://elysee.partcommunity.com" class="cat-btn cat-btn--ghost">View BIM</a>}
      {p.slug === 'epsilon' && <a href="/catalog/compression-fittings/epsilon" class="cat-mono text-[11px] text-[var(--cat-accent)] hover:text-[var(--cat-accent-bright)] mt-2">Discover the technology →</a>}
    </div>
  </aside>
</section>
```

- [ ] **Step 2: Verify**

Run: `npm run check && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/catalog/DetailHero.astro
git commit -m "feat(catalog): DetailHero renders country-conditional product image"
```

---

## Task 4: Wire client-side country switch on detail root

**Files:**
- Modify: `src/scripts/catalog/page-init-detail.ts`

After the country pick, set `data-active-country={country}` on the `[data-catalog-detail]` root so the CSS rules from Task 2 take effect.

- [ ] **Step 1: Add the attribute set**

In `src/scripts/catalog/page-init-detail.ts`, find the function body of `initDetailPage(country, categorySlug)`. Right after the line:

```ts
if (!root) return;
```

Insert:

```ts
root.setAttribute('data-active-country', country);
```

- [ ] **Step 2: Verify**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/scripts/catalog/page-init-detail.ts
git commit -m "feat(catalog): expose active country on detail root after pick"
```

---

## Task 5: Final verification

- [ ] **Step 1: Run all gates**

Run: `cd /Users/marios/Desktop/Cursor/elysse && npm run check && npm run test && npm run build`
Expected: all PASS. The new `coupling-epsilon-pn16` product appears in the build output (1 additional path under `dist/catalog/compression-fittings/`).

- [ ] **Step 2: Manual smoke**

Restart dev server (`pkill -f 'astro dev'; nohup npm run dev > /tmp/elysse-dev.log 2>&1 < /dev/null &`).

Open `http://localhost:<port>/catalog/compression-fittings/coupling-epsilon-pn16` (where `<port>` is whatever Astro picked — `tail -10 /tmp/elysse-dev.log` shows the URL). Walk through:

- [ ] Country modal opens.
- [ ] Pick **Country 1** → product image shows the green Elysée placeholder; SKU table's Code column shows `331016016` etc. (the 331 prefix).
- [ ] Reload, pick **Country 2** → product image shows the navy Rohrsysteme placeholder; SKU table's Code column shows `381016016M` etc. (the 381 prefix with `M` suffix).
- [ ] SKU table has columns Code / Size / Box / Bag (no MOQ / NPT columns visible because all values are 0).
- [ ] Pick **Country 3** → "Not available in Country 3" notice appears (this product's `availableCountries` is `[country-1, country-2]`).
- [ ] Other products like `/catalog/compression-fittings/coupling-transition` still render correctly with the legacy single-code SKU table.

- [ ] **Step 3: Commit any final fix-ups**

If a tweak is needed, commit as `fix(catalog): post-review cleanup` and re-verify.

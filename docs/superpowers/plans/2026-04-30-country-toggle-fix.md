# Country Toggle Fix — Black/Blue Image Switch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the broken country toggle on `/catalog/compression-fittings/coupling-epsilon-pn16` so picking Country 1 reveals the **black** Elysée variant (image + 331-prefix codes) and picking Country 2 reveals the **blue** Rohrsysteme variant (image + 381-prefix codes).

**Architecture:** Three independent bugs (1) attribute name collision between modal-pick buttons and SKU/image variants, (2) placeholder SVGs use green/navy instead of black/blue per the user's "Black & Blue" naming, (3) Playwright verification was never run. Fix the attribute name in one rename pass, swap SVG colors, then verify in-browser via Playwright that picking Country 1 shows black artwork and 331-prefix codes, picking Country 2 shows blue artwork and 381-prefix codes.

**Tech Stack:** Astro 5 · Tailwind v4 · vanilla DOM · Playwright (verification only).

**Spec source:** Existing spec `2026-04-30-products-catalog-elysee-morphology-design.md` plus the user's clarification: black = Country 1, blue = Country 2.

---

## Root cause

The country-modal renders three buttons each with `data-country={c.id}` (used by `country-modal.ts` to identify which button was clicked):

```astro
<button type="button" data-country="country-1" ...>Country 1</button>
<button type="button" data-country="country-2" ...>Country 2</button>
<button type="button" data-country="country-3" ...>Country 3</button>
```

The new SKU table and DetailHero use the **same attribute name** to mark country variants:

```astro
<span data-country="country-1">{code1}</span>  <!-- Elysée code -->
<span data-country="country-2">{code2}</span>  <!-- Rohrsysteme code -->
<img data-country="country-1" src="..." />     <!-- Black -->
<img data-country="country-2" src="..." />     <!-- Blue -->
```

The CSS rule `[data-catalog-detail] [data-country="country-2"] { display: none }` (initial state) matches **the modal's Country 2 button as well as the SKU/image variants**. The Country 2 button is `display: none` from the start. Click → no event fires → `initDetailPage` never runs → `data-active-country` never gets set on the root → the toggle never engages. User sees "no change" because they can only ever pick Country 1.

A Playwright probe confirmed:

```
activeCountry: null
c2Sample[0]: { tag: "BUTTON", text: "Country 2", computedDisplay: "none" }
```

## Fix strategy

Rename the SKU/image variant attribute from `data-country` to **`data-for-country`**. The modal buttons keep `data-country` (used by `country-modal.ts`'s click handler `btn.dataset.country`). The CSS rules and the two component files need their attribute name updated. Three files total.

Then swap the placeholder SVGs to actual black + blue (matching the spreadsheet's "A-(Black & Blue)" naming).

Then verify end-to-end with Playwright: confirm `data-active-country` flips on click and the right variant is visible.

---

## Task 1: Rename `data-country` → `data-for-country` on SKU/image variants and update CSS

**Files:**
- Modify: `src/components/catalog/SkuTable.astro`
- Modify: `src/components/catalog/DetailHero.astro`
- Modify: `src/styles/catalog.css`

- [ ] **Step 1: Update `src/components/catalog/SkuTable.astro` country span attributes**

Find these two lines (currently at lines 45–46):

```astro
                    <span data-country="country-1">{r.code1 ?? ''}</span>
                    <span data-country="country-2">{r.code2 ?? ''}</span>
```

Replace with:

```astro
                    <span data-for-country="country-1">{r.code1 ?? ''}</span>
                    <span data-for-country="country-2">{r.code2 ?? ''}</span>
```

- [ ] **Step 2: Update `src/components/catalog/DetailHero.astro` image attributes**

Find these three lines (currently at lines 31–33):

```astro
          <img src={perCountry['country-1']} data-country="country-1" alt={p.name} width="800" height="800" class="max-w-full max-h-full object-contain p-8" />
          <img src={perCountry['country-2']} data-country="country-2" alt={p.name} width="800" height="800" class="max-w-full max-h-full object-contain p-8" />
          {perCountry['country-3'] && <img src={perCountry['country-3']} data-country="country-3" alt={p.name} width="800" height="800" class="max-w-full max-h-full object-contain p-8" />}
```

Replace with:

```astro
          <img src={perCountry['country-1']} data-for-country="country-1" alt={p.name} width="800" height="800" class="max-w-full max-h-full object-contain p-8" />
          <img src={perCountry['country-2']} data-for-country="country-2" alt={p.name} width="800" height="800" class="max-w-full max-h-full object-contain p-8" />
          {perCountry['country-3'] && <img src={perCountry['country-3']} data-for-country="country-3" alt={p.name} width="800" height="800" class="max-w-full max-h-full object-contain p-8" />}
```

- [ ] **Step 3: Update CSS rules in `src/styles/catalog.css`**

Find the existing block at the bottom of the file (added in the previous task) — every selector containing `[data-country=...]`:

```css
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

Replace the entire block with:

```css
/* Country-conditional content: only the matching country's elements are visible.
 * `data-for-country` is used (not `data-country`) to avoid collision with the
 * country-modal buttons. Defaults to showing country-1 server-side; JS sets
 * data-active-country on the catalog-detail root after the country is picked. */
[data-catalog-detail] [data-for-country="country-1"] { display: inline; }
[data-catalog-detail] [data-for-country="country-2"],
[data-catalog-detail] [data-for-country="country-3"] { display: none; }

[data-catalog-detail][data-active-country="country-2"] [data-for-country="country-1"] { display: none; }
[data-catalog-detail][data-active-country="country-2"] [data-for-country="country-2"] { display: inline; }

[data-catalog-detail][data-active-country="country-3"] [data-for-country="country-1"] { display: none; }
[data-catalog-detail][data-active-country="country-3"] [data-for-country="country-3"] { display: inline; }

/* Image variants are block, not inline. */
[data-catalog-detail] img[data-for-country="country-1"] { display: block; }
[data-catalog-detail] img[data-for-country="country-2"],
[data-catalog-detail] img[data-for-country="country-3"] { display: none; }
[data-catalog-detail][data-active-country="country-2"] img[data-for-country="country-1"] { display: none; }
[data-catalog-detail][data-active-country="country-2"] img[data-for-country="country-2"] { display: block; }
[data-catalog-detail][data-active-country="country-3"] img[data-for-country="country-1"] { display: none; }
[data-catalog-detail][data-active-country="country-3"] img[data-for-country="country-3"] { display: block; }
```

- [ ] **Step 4: Verify**

Run: `cd /Users/marios/Desktop/Cursor/elysse && npm run check`
Expected: PASS — 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/catalog/SkuTable.astro src/components/catalog/DetailHero.astro src/styles/catalog.css
git commit -m "fix(catalog): rename data-country to data-for-country to avoid modal button collision"
```

---

## Task 2: Replace placeholder SVGs with real black + blue artwork

**Files:**
- Modify: `public/images/products/coupling-epsilon-pn16-elysee.svg`
- Modify: `public/images/products/coupling-epsilon-pn16-rohrsysteme.svg`

The existing placeholders use green (#3d6b52) and navy (#0a4570). The user wants black for Country 1 (Elysée) and blue for Country 2 (Rohrsysteme), matching the spreadsheet's "Black & Blue" sheet naming.

- [ ] **Step 1: Replace `public/images/products/coupling-epsilon-pn16-elysee.svg` with the black version**

Write the file with this exact content:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#ffffff"/>
  <circle cx="200" cy="200" r="120" fill="none" stroke="#0a1410" stroke-width="6"/>
  <circle cx="200" cy="200" r="80" fill="none" stroke="#0a1410" stroke-width="3"/>
  <rect x="160" y="80" width="80" height="240" fill="none" stroke="#0a1410" stroke-width="4"/>
  <text x="200" y="55" font-family="system-ui, sans-serif" font-size="22" font-weight="700" fill="#0a1410" text-anchor="middle">Elysée</text>
  <text x="200" y="370" font-family="ui-monospace, monospace" font-size="14" fill="#0a1410" text-anchor="middle">No. 331 — black</text>
</svg>
```

- [ ] **Step 2: Replace `public/images/products/coupling-epsilon-pn16-rohrsysteme.svg` with the blue version**

Write the file with this exact content:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#ffffff"/>
  <circle cx="200" cy="200" r="120" fill="none" stroke="#1d4ed8" stroke-width="6"/>
  <circle cx="200" cy="200" r="80" fill="none" stroke="#1d4ed8" stroke-width="3"/>
  <rect x="160" y="80" width="80" height="240" fill="none" stroke="#1d4ed8" stroke-width="4"/>
  <text x="200" y="55" font-family="system-ui, sans-serif" font-size="22" font-weight="700" fill="#1d4ed8" text-anchor="middle">Rohrsysteme</text>
  <text x="200" y="370" font-family="ui-monospace, monospace" font-size="14" fill="#1d4ed8" text-anchor="middle">No. 381 — blue</text>
</svg>
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/marios/Desktop/Cursor/elysse && npm run build`
Expected: PASS — both SVGs included in `dist/images/products/`.

- [ ] **Step 4: Commit**

```bash
git add public/images/products/coupling-epsilon-pn16-elysee.svg public/images/products/coupling-epsilon-pn16-rohrsysteme.svg
git commit -m "fix(catalog): coupling-epsilon-pn16 placeholder colors -> black (country-1) / blue (country-2)"
```

---

## Task 3: Verify end-to-end with Playwright

**Files:** none modified — verification step.

Open the page, click Country 1, assert state, reload, click Country 2, assert state, reload, click Country 3, assert "Not available" notice. Use computed CSS display values, not just attribute presence.

- [ ] **Step 1: Restart the dev server**

```bash
pkill -f 'astro dev' 2>/dev/null
sleep 1
nohup npm run dev > /tmp/elysse-dev.log 2>&1 < /dev/null &
disown
sleep 4
tail -8 /tmp/elysse-dev.log
```

Expected: `Local http://localhost:<port>/` line. Note the port — the rest of this task uses that port.

- [ ] **Step 2: Probe Country 1 path via Playwright**

Navigate Playwright to `http://localhost:<port>/catalog/compression-fittings/coupling-epsilon-pn16`.

Run this evaluate:

```js
() => {
  const c1Btn = document.querySelector('[data-country-modal] button[data-country="country-1"]');
  const c1Display = c1Btn ? getComputedStyle(c1Btn).display : 'NO BUTTON';
  return { c1ButtonDisplay: c1Display };
}
```
Expected: `c1ButtonDisplay: "inline-flex"` (the button is visible — the cat-btn class makes it inline-flex). If `none`, the rename in Task 1 missed something — re-check.

- [ ] **Step 3: Click Country 1 and verify**

```js
() => {
  const c1Btn = document.querySelector('[data-country-modal] button[data-country="country-1"]');
  c1Btn.click();
  return new Promise(r => setTimeout(() => {
    const root = document.querySelector('[data-catalog-detail]');
    const heroImg = document.querySelector('[data-catalog-detail] img[data-for-country="country-1"]');
    const skuFirstCode1 = document.querySelector('[data-catalog-detail] [data-for-country="country-1"]:not(img)');
    const skuFirstCode2 = document.querySelector('[data-catalog-detail] [data-for-country="country-2"]:not(img)');
    r({
      activeCountry: root?.getAttribute('data-active-country'),
      c1ImgDisplay: heroImg ? getComputedStyle(heroImg).display : null,
      c1ImgSrc: heroImg?.getAttribute('src'),
      c1CodeText: skuFirstCode1?.textContent?.trim(),
      c1CodeDisplay: skuFirstCode1 ? getComputedStyle(skuFirstCode1).display : null,
      c2CodeDisplay: skuFirstCode2 ? getComputedStyle(skuFirstCode2).display : null,
    });
  }, 250));
}
```

Expected:
- `activeCountry: "country-1"`
- `c1ImgDisplay: "block"`
- `c1ImgSrc: "/images/products/coupling-epsilon-pn16-elysee.svg"` (the BLACK one)
- `c1CodeText: "331016016"`
- `c1CodeDisplay: "inline"`
- `c2CodeDisplay: "none"`

- [ ] **Step 4: Reload and verify Country 2 path**

Navigate Playwright back to the same URL (testing-mode = modal re-prompts).

Run:

```js
() => {
  const c2Btn = document.querySelector('[data-country-modal] button[data-country="country-2"]');
  c2Btn.click();
  return new Promise(r => setTimeout(() => {
    const root = document.querySelector('[data-catalog-detail]');
    const c1Img = document.querySelector('[data-catalog-detail] img[data-for-country="country-1"]');
    const c2Img = document.querySelector('[data-catalog-detail] img[data-for-country="country-2"]');
    const skuC1 = document.querySelector('[data-catalog-detail] [data-for-country="country-1"]:not(img)');
    const skuC2 = document.querySelector('[data-catalog-detail] [data-for-country="country-2"]:not(img)');
    r({
      activeCountry: root?.getAttribute('data-active-country'),
      c1ImgDisplay: c1Img ? getComputedStyle(c1Img).display : null,
      c2ImgDisplay: c2Img ? getComputedStyle(c2Img).display : null,
      c2ImgSrc: c2Img?.getAttribute('src'),
      c1CodeDisplay: skuC1 ? getComputedStyle(skuC1).display : null,
      c2CodeDisplay: skuC2 ? getComputedStyle(skuC2).display : null,
      c2CodeText: skuC2?.textContent?.trim(),
    });
  }, 250));
}
```

Expected:
- `activeCountry: "country-2"`
- `c1ImgDisplay: "none"`
- `c2ImgDisplay: "block"`
- `c2ImgSrc: "/images/products/coupling-epsilon-pn16-rohrsysteme.svg"` (the BLUE one)
- `c1CodeDisplay: "none"`
- `c2CodeDisplay: "inline"`
- `c2CodeText: "381016016M"`

- [ ] **Step 5: Reload and verify Country 3 path (not-available)**

Navigate Playwright back to the same URL.

Run:

```js
() => {
  const c3Btn = document.querySelector('[data-country-modal] button[data-country="country-3"]');
  c3Btn.click();
  return new Promise(r => setTimeout(() => {
    const gate = document.querySelector('[data-availability-gate]');
    r({
      activeCountry: document.querySelector('[data-catalog-detail]')?.getAttribute('data-active-country'),
      gateText: gate?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 80)
    });
  }, 250));
}
```

Expected:
- `activeCountry: "country-3"`
- `gateText` starts with `"Not available in Country 3"` (this product is `[country-1, country-2]` only).

- [ ] **Step 6: If any expected value didn't match, fix the underlying issue and re-run**

Common failure modes:
- `c1ButtonDisplay` is `"none"` after Task 1 → CSS rule still references `[data-country]` somewhere; grep again with `grep -n '\[data-country=' src/styles/catalog.css` and rename any remaining hits.
- `activeCountry` is `null` → `initDetailPage` not firing; check the boot script's import map and the country-modal click handler.
- Image src is wrong → MDX `imageUrls` field or `PER_COUNTRY_IMAGES` lookup keyed wrong.

- [ ] **Step 7: Optional final commit if a fix-up was needed**

```bash
git add -A
git commit -m "fix(catalog): post-verification cleanup"
```

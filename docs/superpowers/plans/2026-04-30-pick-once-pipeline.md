# Pick-Once Country Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The country picker fires **once** at `/products` (the entry point); subsequent navigation through `/catalog/<category>` and `/catalog/<category>/<product>` reuses the choice without re-prompting.

**Architecture:** Restore localStorage persistence (currently disabled by the testing-mode bypass commit `635e6a9`). On `/products`, open the modal **only when no country is stored**; on pick, write to `localStorage` and stay on the page so the user clicks a category. On the two `/catalog` routes, read `localStorage` first; if a country is stored, skip the modal entirely and init the page; if not (deep link), open the modal as a fallback and write the pick.

**Tech Stack:** Astro 5 · TypeScript · vanilla DOM · `localStorage`.

---

## Current state (what's broken)

Three pages each open the country modal on every visit:

- `src/pages/products/index.astro` — modal opens; no `writeCountry` call (data lost on pick)
- `src/pages/catalog/[category]/index.astro` — modal opens, `writeCountry` not called either
- `src/pages/catalog/[category]/[product].astro` — same

So the user picks a country on `/products`, clicks a category, lands on `/catalog/<category>`, and is asked again. That's the bug.

`src/scripts/catalog/country.ts` already exports `readCountry()` and `writeCountry(country)` from the original spec — they're just not being called in the boot scripts. The fix is to wire them in correctly.

## Pick-once flow (target behavior)

1. **First visit** to `/products` → `readCountry()` returns `null` → modal opens. User picks → `writeCountry(picked)` → modal closes. User stays on `/products` and clicks a category card.
2. **Subsequent visit** to `/products` → `readCountry()` returns the stored slug → modal stays hidden. (User can re-pick later via DevTools `localStorage.removeItem('elysee.country')` for now; a re-pick UI is out of scope.)
3. `/catalog/<category>` → `readCountry()` returns the stored slug → no modal, `initCatalogPage(stored)` runs immediately.
4. `/catalog/<category>` deep-link with no stored country → modal opens as fallback → on pick, `writeCountry(picked)` and proceed.
5. `/catalog/<category>/<product>` → same logic as #3 / #4.

---

## File overview

**Modified:**
- `src/pages/products/index.astro` — boot script reads first, opens modal only if missing, writes on pick
- `src/pages/catalog/[category]/index.astro` — boot script reads first, skips modal when stored, writes on fallback pick
- `src/pages/catalog/[category]/[product].astro` — same pattern
- `tests/catalogCountry.test.ts` — verify the round-trip still passes (no real change expected; sanity check)

**No changes needed:**
- `src/scripts/catalog/country.ts` — already correct
- `src/components/catalog/CountryModal.astro`, `country-modal.ts` — unchanged

---

## Task 1: `/products` — write on pick, skip modal when stored

**Files:**
- Modify: `src/pages/products/index.astro`

- [ ] **Step 1: Replace the existing inline `<script>` block at the bottom of the file**

Current block (testing-mode):

```astro
  <script>
    import { openCountryModal } from '~/scripts/catalog/country-modal';
    function go() { openCountryModal(() => {}); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
    else go();
  </script>
```

Replace with:

```astro
  <script>
    import { openCountryModal } from '~/scripts/catalog/country-modal';
    import { readCountry, writeCountry } from '~/scripts/catalog/country';

    function go() {
      // Pick-once: only prompt when nothing is stored yet.
      if (readCountry()) return;
      openCountryModal((picked) => { writeCountry(picked); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
    else go();
  </script>
```

- [ ] **Step 2: Verify**

Run: `cd /Users/marios/Desktop/Cursor/elysse && npm run check`
Expected: PASS — 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/products/index.astro
git commit -m "fix(products): write country to localStorage on pick, skip modal when stored"
```

---

## Task 2: `/catalog/<category>` — read first, skip modal when stored

**Files:**
- Modify: `src/pages/catalog/[category]/index.astro`

- [ ] **Step 1: Replace the existing inline `<script>` block at the bottom of the file**

Current block (testing-mode):

```astro
  <script>
    import { initCatalogPage } from '~/scripts/catalog/page-init';
    import { initBasketUi } from '~/scripts/catalog/basket-ui';
    import { openCountryModal } from '~/scripts/catalog/country-modal';

    function go() {
      initBasketUi();
      const empty = !document.querySelector('[data-country-modal]');
      if (empty) return;
      // Category is the second segment of /catalog/<category>.
      const parts = window.location.pathname.split('/').filter(Boolean);
      const category = parts[1];
      openCountryModal((picked) => {
        initCatalogPage(picked, category);
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
    else go();
  </script>
```

Replace with:

```astro
  <script>
    import { initCatalogPage } from '~/scripts/catalog/page-init';
    import { initBasketUi } from '~/scripts/catalog/basket-ui';
    import { openCountryModal } from '~/scripts/catalog/country-modal';
    import { readCountry, writeCountry } from '~/scripts/catalog/country';

    function go() {
      initBasketUi();
      const empty = !document.querySelector('[data-country-modal]');
      if (empty) return;
      // Category is the second segment of /catalog/<category>.
      const parts = window.location.pathname.split('/').filter(Boolean);
      const category = parts[1];
      const stored = readCountry();
      if (stored) {
        initCatalogPage(stored, category);
        return;
      }
      openCountryModal((picked) => {
        writeCountry(picked);
        initCatalogPage(picked, category);
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
    else go();
  </script>
```

- [ ] **Step 2: Verify**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/pages/catalog/[category]/index.astro
git commit -m "fix(catalog): listing page reads stored country, skips modal when present"
```

---

## Task 3: `/catalog/<category>/<product>` — read first, skip modal when stored

**Files:**
- Modify: `src/pages/catalog/[category]/[product].astro`

- [ ] **Step 1: Replace the existing inline `<script>` block at the bottom of the file**

Current block (testing-mode):

```astro
  <script>
    import { initDetailPage } from '~/scripts/catalog/page-init-detail';
    import { initBasketUi } from '~/scripts/catalog/basket-ui';
    import { openCountryModal } from '~/scripts/catalog/country-modal';

    function go() {
      initBasketUi();
      // Category is the second segment of /catalog/<category>/<product>.
      const parts = window.location.pathname.split('/').filter(Boolean);
      const category = parts[1];
      openCountryModal((picked) => {
        initDetailPage(picked, category);
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
    else go();
  </script>
```

Replace with:

```astro
  <script>
    import { initDetailPage } from '~/scripts/catalog/page-init-detail';
    import { initBasketUi } from '~/scripts/catalog/basket-ui';
    import { openCountryModal } from '~/scripts/catalog/country-modal';
    import { readCountry, writeCountry } from '~/scripts/catalog/country';

    function go() {
      initBasketUi();
      // Category is the second segment of /catalog/<category>/<product>.
      const parts = window.location.pathname.split('/').filter(Boolean);
      const category = parts[1];
      const stored = readCountry();
      if (stored) {
        initDetailPage(stored, category);
        return;
      }
      openCountryModal((picked) => {
        writeCountry(picked);
        initDetailPage(picked, category);
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
    else go();
  </script>
```

- [ ] **Step 2: Verify**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/pages/catalog/[category]/[product].astro
git commit -m "fix(catalog): detail page reads stored country, skips modal when present"
```

---

## Task 4: End-to-end Playwright verification

**Files:** none modified — verification step.

- [ ] **Step 1: Restart the dev server**

```bash
pkill -f 'astro dev' 2>/dev/null
sleep 1
nohup npm run dev > /tmp/elysse-dev.log 2>&1 < /dev/null &
disown
sleep 4
grep -oE 'http://localhost:[0-9]+/' /tmp/elysse-dev.log | head -1
```

Note the port — call it `<port>` below.

- [ ] **Step 2: Probe — fresh state (no localStorage), `/products` should open modal**

Use Playwright. Navigate to `http://localhost:<port>/products`.

Run:

```js
() => {
  localStorage.removeItem('elysee.country');
  location.reload();
}
```

Wait 500ms, then run:

```js
() => ({
  modalOpen: !document.querySelector('[data-country-modal]').hasAttribute('hidden'),
  storedCountry: localStorage.getItem('elysee.country')
})
```

Expected: `modalOpen: true`, `storedCountry: null`.

- [ ] **Step 3: Pick Country 1 on `/products`**

```js
() => {
  document.querySelector('[data-country-modal] button[data-country="country-1"]').click();
  return new Promise(r => setTimeout(() => r({
    modalOpen: !document.querySelector('[data-country-modal]').hasAttribute('hidden'),
    storedCountry: localStorage.getItem('elysee.country')
  }), 200));
}
```

Expected: `modalOpen: false`, `storedCountry: "country-1"`.

- [ ] **Step 4: Navigate to `/catalog/hydraulic-fittings` — modal must NOT re-open**

Navigate to `http://localhost:<port>/catalog/hydraulic-fittings`.

Run:

```js
() => new Promise(r => setTimeout(() => r({
  modalOpen: !document.querySelector('[data-country-modal]').hasAttribute('hidden'),
  storedCountry: localStorage.getItem('elysee.country'),
  visibleProducts: Array.from(document.querySelectorAll('[data-product-card]'))
    .filter(el => getComputedStyle(el).display !== 'none')
    .map(el => el.dataset.slug)
}), 250));
```

Expected: `modalOpen: false`, `storedCountry: "country-1"`, `visibleProducts` is the country-1 subset of hydraulic-fittings (in the demo data, only `adaptor-flanged` is country-1 — wait, check: `adaptor-flanged` is country-2 only, `single-4-bolts` is country-2 + country-3). So country-1 in hydraulic-fittings should produce **0 products** — the empty state OR a 0-count grid.

If 0 products is unexpected, swap to `country-2` for the test and target `/catalog/hydraulic-fittings`. Or test against `/catalog/compression-fittings` (where country-1 has 4 products: epsilon, coupling-repair, coupling-transition, coupling-epsilon-pn16).

Recommended targets:
- After picking `country-1`, navigate to `/catalog/compression-fittings` — expect 4 products.
- After picking `country-2`, navigate to `/catalog/hydraulic-fittings` — expect 2 products (adaptor-flanged, single-4-bolts).

- [ ] **Step 5: Navigate to a product detail — modal must NOT re-open**

Navigate to `http://localhost:<port>/catalog/compression-fittings/coupling-epsilon-pn16` (with `country-1` still stored).

Run:

```js
() => new Promise(r => setTimeout(() => r({
  modalOpen: !document.querySelector('[data-country-modal]').hasAttribute('hidden'),
  activeCountry: document.querySelector('[data-catalog-detail]')?.getAttribute('data-active-country')
}), 250));
```

Expected: `modalOpen: false`, `activeCountry: "country-1"`. The image and codes show the country-1 (Elysée) variant.

- [ ] **Step 6: Reset and confirm deep-link fallback**

In the same Playwright session:

```js
() => { localStorage.removeItem('elysee.country'); location.reload(); }
```

Wait 500ms. Then:

```js
() => ({
  modalOpen: !document.querySelector('[data-country-modal]').hasAttribute('hidden')
})
```

Expected: `modalOpen: true` — the detail page falls back to opening the modal when no country is stored (deep-link case).

- [ ] **Step 7: If any expected value didn't match, debug and fix**

Common failure modes:
- Modal still opens on `/catalog/<category>` after pick on `/products` → check that `writeCountry` is being called in the `/products` boot script and that `readCountry` is being called BEFORE the openCountryModal in the catalog boot scripts.
- `storedCountry: null` after picking a country → `writeCountry` import wrong or callback never fires.

If a fix-up is needed, commit it as `fix(catalog): pipeline post-review cleanup`.

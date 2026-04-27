import type { CatalogProduct, Filters, SortKey } from './types';
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

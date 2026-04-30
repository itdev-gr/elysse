import type { Country, CategorySlug } from './types';
import { COUNTRIES } from './types';
import { getBasket } from './basket-store';

export function initDetailPage(country: Country, categorySlug: CategorySlug) {
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

  // Add to quote — only wires whatever quote buttons remain after the gate replacement
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

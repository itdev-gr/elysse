import { getBasket } from './basket-store';

export function initDetailPage() {
  const root = document.querySelector<HTMLElement>('[data-catalog-detail]');
  if (!root) return;

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

  // Add to quote (any [data-add-to-quote] on the page) — with state subscription
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

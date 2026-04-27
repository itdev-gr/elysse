import { getBasket } from './basket-store';

export function initBasketUi() {
  const root = document.querySelector<HTMLElement>('[data-quote-basket]');
  if (!root) return;

  const pill        = root.querySelector<HTMLButtonElement>('[data-basket-pill]')!;
  const countEl     = root.querySelector<HTMLElement>('[data-basket-count]')!;
  const drawer      = root.querySelector<HTMLElement>('[data-basket-drawer]')!;
  const closeBtn    = root.querySelector<HTMLButtonElement>('[data-basket-close]')!;
  const itemsList   = root.querySelector<HTMLElement>('[data-basket-items]')!;
  const emptyState  = root.querySelector<HTMLElement>('[data-basket-empty]')!;
  const footer      = root.querySelector<HTMLElement>('[data-basket-footer]')!;
  const checkoutBtn = root.querySelector<HTMLButtonElement>('[data-basket-checkout]')!;
  const backBtn     = root.querySelector<HTMLButtonElement>('[data-basket-back-to-list]')!;
  const form        = root.querySelector<HTMLFormElement>('[data-basket-form]')!;
  const success     = root.querySelector<HTMLElement>('[data-basket-success]')!;
  const titleEl     = root.querySelector<HTMLElement>('[data-basket-title]')!;

  const basket = getBasket();
  let lastFocused: HTMLElement | null = null;

  function renderItems() {
    const items = basket.getItems();
    const count = basket.getCount();
    countEl.textContent = String(count);
    pill.classList.toggle('hidden', count === 0);
    titleEl.textContent = `Quote request (${items.length} item${items.length === 1 ? '' : 's'})`;
    if (items.length === 0) {
      itemsList.innerHTML = '';
      itemsList.classList.add('hidden');
      emptyState.classList.remove('hidden');
      footer.classList.add('hidden');
      return;
    }
    emptyState.classList.add('hidden');
    itemsList.classList.remove('hidden');
    footer.classList.remove('hidden');
    itemsList.innerHTML = items.map(it => `
      <article class="flex gap-3 items-center border-b border-[var(--cat-hairline)] pb-3">
        <img src="${it.thumb}" alt="" width="60" height="60" class="bg-white border border-[var(--cat-hairline)] rounded object-contain p-1" />
        <div class="flex-1 min-w-0">
          ${it.code ? `<p class="cat-mono text-[10px] text-[var(--cat-ink-subtle)]">${it.code}</p>` : ''}
          <p class="text-sm truncate">${it.name}</p>
        </div>
        <input type="number" min="1" max="99" value="${it.qty}" data-basket-qty data-slug="${it.slug}" class="cat-mono text-xs w-14 border border-[var(--cat-hairline-strong)] rounded-sm px-1 py-0.5 text-center" aria-label="Quantity" />
        <button type="button" data-basket-remove data-slug="${it.slug}" class="cat-mono text-xs px-1" aria-label="Remove">✕</button>
      </article>
    `).join('');
  }

  function open() {
    lastFocused = document.activeElement as HTMLElement;
    drawer.classList.remove('hidden');
    drawer.classList.add('flex');
    closeBtn.focus();
  }
  function close() {
    drawer.classList.add('hidden');
    drawer.classList.remove('flex');
    showItemsView();
    lastFocused?.focus();
  }
  function showItemsView() {
    form.classList.add('hidden');
    success.classList.add('hidden');
    itemsList.classList.toggle('hidden', basket.getItems().length === 0);
    if (basket.getItems().length > 0) footer.classList.remove('hidden');
    backBtn.classList.add('hidden');
  }
  function showFormView() {
    itemsList.classList.add('hidden');
    emptyState.classList.add('hidden');
    footer.classList.add('hidden');
    success.classList.add('hidden');
    form.classList.remove('hidden');
    backBtn.classList.remove('hidden');
  }
  function showSuccess() {
    itemsList.classList.add('hidden');
    emptyState.classList.add('hidden');
    footer.classList.add('hidden');
    form.classList.add('hidden');
    success.classList.remove('hidden');
  }

  pill.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  drawer.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  itemsList.addEventListener('input', (e) => {
    const t = e.target as HTMLElement;
    if (t.matches('[data-basket-qty]')) {
      const input = t as HTMLInputElement;
      const qty = Math.max(1, Math.min(99, +input.value || 1));
      basket.setQty(input.dataset.slug!, qty);
    }
  });
  itemsList.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-basket-remove]');
    if (t) basket.remove(t.dataset.slug!);
  });

  checkoutBtn.addEventListener('click', () => {
    if (basket.getItems().length === 0) return;
    showFormView();
  });
  backBtn.addEventListener('click', showItemsView);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const payload = { ...data, items: basket.getItems() };
    console.log('[quote-request]', payload);
    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
    await new Promise(r => setTimeout(r, 600));
    basket.clear();
    form.reset();
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send request'; }
    showSuccess();
  });

  basket.subscribe(renderItems);
  renderItems();
}

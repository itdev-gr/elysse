import type { BasketItem } from './types';

const KEY = 'elysee.catalog.quote.v1';
const CAP = 50;

export interface BasketStore {
  getItems(): BasketItem[];
  getCount(): number;
  isFull(): boolean;
  add(item: BasketItem): void;
  setQty(slug: string, qty: number): void;
  remove(slug: string): void;
  clear(): void;
  subscribe(fn: (items: BasketItem[]) => void): () => void;
}

function load(): BasketItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function save(items: BasketItem[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* quota */ }
}

export function createBasketStore(): BasketStore {
  let items = load();
  const subs = new Set<(items: BasketItem[]) => void>();

  const notify = () => { save(items); subs.forEach(fn => fn(items)); };

  return {
    getItems: () => items.slice(),
    getCount: () => items.reduce((n, it) => n + it.qty, 0),
    isFull: () => items.length >= CAP,
    add: (item) => {
      const existing = items.find(i => i.slug === item.slug);
      if (existing) { existing.qty += item.qty; }
      else if (items.length < CAP) { items = [...items, item]; }
      notify();
    },
    setQty: (slug, qty) => {
      if (qty <= 0) items = items.filter(i => i.slug !== slug);
      else items = items.map(i => i.slug === slug ? { ...i, qty } : i);
      notify();
    },
    remove: (slug) => { items = items.filter(i => i.slug !== slug); notify(); },
    clear: () => { items = []; notify(); },
    subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn); }
  };
}

let _instance: BasketStore | null = null;
export function getBasket(): BasketStore {
  if (!_instance) _instance = createBasketStore();
  return _instance;
}

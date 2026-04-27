import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createBasketStore } from '~/scripts/catalog/basket-store';
import type { BasketItem } from '~/scripts/catalog/types';

const sample: BasketItem = { slug: 'epsilon', code: 'EPS-PE-001', name: 'Epsilon Series', thumb: '/epsilon.svg', qty: 1 };

describe('basket-store', () => {
  beforeEach(() => { localStorage.clear(); });

  it('starts empty', () => {
    const s = createBasketStore();
    expect(s.getItems()).toEqual([]);
    expect(s.getCount()).toBe(0);
  });

  it('adds items', () => {
    const s = createBasketStore();
    s.add(sample);
    expect(s.getItems()).toEqual([sample]);
    expect(s.getCount()).toBe(1);
  });

  it('increments qty when adding the same slug', () => {
    const s = createBasketStore();
    s.add(sample);
    s.add(sample);
    expect(s.getItems()[0].qty).toBe(2);
    expect(s.getCount()).toBe(2);
  });

  it('updates qty', () => {
    const s = createBasketStore();
    s.add(sample);
    s.setQty('epsilon', 5);
    expect(s.getItems()[0].qty).toBe(5);
  });

  it('removes when setQty 0', () => {
    const s = createBasketStore();
    s.add(sample);
    s.setQty('epsilon', 0);
    expect(s.getItems()).toEqual([]);
  });

  it('clears all', () => {
    const s = createBasketStore();
    s.add(sample);
    s.clear();
    expect(s.getItems()).toEqual([]);
  });

  it('persists to localStorage and restores', () => {
    const s1 = createBasketStore();
    s1.add(sample);
    const s2 = createBasketStore();
    expect(s2.getItems()).toEqual([sample]);
  });

  it('caps at 50 items', () => {
    const s = createBasketStore();
    for (let i = 0; i < 60; i++) {
      s.add({ ...sample, slug: `p-${i}`, name: `P${i}` });
    }
    expect(s.getItems().length).toBe(50);
  });

  it('reports isFull at cap', () => {
    const s = createBasketStore();
    for (let i = 0; i < 50; i++) s.add({ ...sample, slug: `p-${i}` });
    expect(s.isFull()).toBe(true);
  });

  it('notifies subscribers on change', () => {
    const s = createBasketStore();
    const fn = vi.fn();
    s.subscribe(fn);
    s.add(sample);
    expect(fn).toHaveBeenCalledWith([sample]);
  });
});

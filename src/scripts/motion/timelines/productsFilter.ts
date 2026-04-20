import { gsap, Flip, registerGSAP } from '../registerGSAP';

export function initProductsFilter() {
  registerGSAP();
  const filters = document.querySelectorAll<HTMLButtonElement>('[data-filter]');
  const cards   = document.querySelectorAll<HTMLElement>('[data-product-card]');
  if (!filters.length || !cards.length) return;

  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      const slug = btn.dataset.slug!;
      filters.forEach(f => f.setAttribute('data-active', String(f.dataset.slug === slug)));

      const state = Flip.getState(cards);
      cards.forEach(c => {
        const match = slug === 'all' || c.dataset.category === slug;
        c.style.display = match ? '' : 'none';
      });
      Flip.from(state, {
        duration: 0.7, ease: 'expo.inOut', absolute: true,
        onEnter:    (el) => gsap.fromTo(el, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.5 }),
        onLeave:    (el) => gsap.to(el, { opacity: 0, scale: 0.92, duration: 0.35 })
      });
    });
  });
}

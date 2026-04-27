import type { Country } from './types';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

let activeKeydown: ((e: KeyboardEvent) => void) | null = null;
let priorBodyOverflow = '';
let previouslyFocused: Element | null = null;

export function openCountryModal(onPick: (country: Country) => void): void {
  const modal = document.querySelector<HTMLElement>('[data-country-modal]');
  if (!modal) return;

  previouslyFocused = document.activeElement;
  priorBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  modal.removeAttribute('hidden');

  const buttons = modal.querySelectorAll<HTMLButtonElement>('button[data-country]');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const c = btn.dataset.country as Country | undefined;
      if (!c) return;
      closeCountryModal();
      onPick(c);
    }, { once: true });
  });

  // Focus the first button.
  const first = modal.querySelector<HTMLElement>(FOCUSABLE);
  first?.focus();

  // Focus trap + block Escape.
  activeKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); return; }
    if (e.key !== 'Tab') return;
    const focusables = Array.from(modal.querySelectorAll<HTMLElement>(FOCUSABLE))
      .filter(el => !el.hasAttribute('disabled'));
    if (focusables.length === 0) return;
    const firstEl = focusables[0];
    const lastEl = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === firstEl) {
      e.preventDefault();
      lastEl.focus();
    } else if (!e.shiftKey && document.activeElement === lastEl) {
      e.preventDefault();
      firstEl.focus();
    }
  };
  document.addEventListener('keydown', activeKeydown, true);
}

export function closeCountryModal(): void {
  const modal = document.querySelector<HTMLElement>('[data-country-modal]');
  if (!modal) return;
  modal.setAttribute('hidden', '');
  document.body.style.overflow = priorBodyOverflow;
  if (activeKeydown) {
    document.removeEventListener('keydown', activeKeydown, true);
    activeKeydown = null;
  }
  if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
  previouslyFocused = null;
}

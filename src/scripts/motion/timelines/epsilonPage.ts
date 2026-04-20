import { gsap, ScrollTrigger, registerGSAP } from '../registerGSAP';
import { prefersReducedMotion } from '~/scripts/utils/reducedMotion';

export function initEpsilonPage() {
  registerGSAP();

  // --- E1 · Reveal (one-shot on load) ---
  const subline = document.querySelector('[data-e1-subline]');
  const title = document.querySelector('[data-e1-title]');
  const tagline = document.querySelector('[data-e1-tagline]');
  if (subline && title && tagline) {
    if (prefersReducedMotion()) {
      (tagline as HTMLElement).style.opacity = '1';
    } else {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from(subline, { opacity: 0, y: 10, duration: 0.6 })
        .from(title, { opacity: 0, y: 40, duration: 1.0 }, '-=0.3')
        .to(tagline, { opacity: 1, y: 0, duration: 0.5 }, '-=0.4');
    }
  }

  if (prefersReducedMotion()) {
    document.querySelectorAll<HTMLElement>('[data-e3-row]').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
    document.querySelectorAll<HTMLElement>('[data-epart-label]').forEach(el => el.classList.remove('hidden'));
    return;
  }

  // --- E2 · Disassembly (pinned, scrubbed) ---
  const e2 = document.querySelector('[data-e2-pin]') as HTMLElement | null;
  if (e2) {
    gsap.set('[data-epart-label]', { opacity: 0 });
    gsap.utils.toArray<HTMLElement>('[data-epart-label]').forEach(el => el.classList.remove('hidden'));

    ScrollTrigger.create({
      trigger: e2,
      start: 'top top',
      end: '+=300%',
      pin: true,
      scrub: 0.5,
      animation: gsap.timeline()
        .to('[data-epart="nut"]',    { y: -180, duration: 1 }, 0)
        .to('[data-epart-label="nut"]',    { opacity: 1, duration: 0.4 }, 0.3)
        .to('[data-epart="oring"]',  { x: 220, scale: 1.2, duration: 1 }, 0.3)
        .to('[data-epart-label="oring"]',  { opacity: 1, duration: 0.4 }, 0.6)
        .to('[data-epart="collet"]', { x: -200, duration: 1 }, 0.6)
        .to('[data-epart-label="collet"]', { opacity: 1, duration: 0.4 }, 0.9)
        .to('[data-epart="insert"]', { x: 260, duration: 1 }, 0.9)
        .to('[data-epart-label="insert"]', { opacity: 1, duration: 0.4 }, 1.2)
        .to('[data-epart="body"]',   { x: -260, scaleX: 1.1, duration: 1 }, 1.2)
        .to('[data-epart-label="body"]',   { opacity: 1, duration: 0.4 }, 1.5)
    });

    ScrollTrigger.create({
      trigger: e2,
      start: 'top 80%',
      end: 'bottom top',
      onEnter:     () => (window as any).__flow?.setPreset('epsilon', 1000),
      onLeaveBack: () => (window as any).__flow?.setPreset('hero', 800)
    });
  }

  // --- E3 · Spec rows ---
  ScrollTrigger.batch('[data-e3-row]', {
    onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, stagger: 0.06, duration: 0.5, ease: 'expo.out' }),
    start: 'top 80%'
  });

  // --- E4 · Install film strip ---
  const e4 = document.querySelector('[data-e4-pin]') as HTMLElement | null;
  const frames = gsap.utils.toArray<HTMLElement>('[data-e4-frame]');
  if (e4 && frames.length) {
    ScrollTrigger.create({
      trigger: '[data-section="e4-install"]',
      start: 'top top',
      end: () => `+=${window.innerWidth * (frames.length - 1)}`,
      pin: true,
      scrub: 0.5,
      animation: gsap.to(e4, { x: () => -((frames.length - 1) * (window.innerWidth * 0.42 + 24)), ease: 'none' }),
      onUpdate: (self) => {
        const idx = Math.round(self.progress * (frames.length - 1));
        frames.forEach((f, i) => { f.style.opacity = i === idx ? '1' : '0.4'; });
      }
    });
  }
}

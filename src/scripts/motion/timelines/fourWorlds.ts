import { gsap, ScrollTrigger, registerGSAP } from '../registerGSAP';

export function initFourWorlds() {
  registerGSAP();
  const pin = document.querySelector('[data-worlds-pin]') as HTMLElement | null;
  const track = document.querySelector('[data-worlds-track]') as HTMLElement | null;
  const panels = gsap.utils.toArray<HTMLElement>('[data-world-panel]');
  const ticks  = gsap.utils.toArray<HTMLElement>('[data-worlds-tick]');
  if (!pin || !track || panels.length === 0) return;

  const total = panels.length;

  ScrollTrigger.create({
    trigger: pin,
    start: 'top top',
    end: () => `+=${window.innerWidth * (total - 1)}`,
    pin: true,
    scrub: 0.5,
    anticipatePin: 1,
    animation: gsap.to(track, { x: () => -window.innerWidth * (total - 1), ease: 'none' }),
    onUpdate: (self) => {
      const progress = self.progress * (total - 1);
      const idx = Math.round(progress);
      const preset = panels[idx]?.dataset.preset as string | undefined;
      const last = (window as any).__lastWorldPreset;
      if (preset && preset !== last) {
        (window as any).__flow?.setPreset(preset, 800);
        (window as any).__lastWorldPreset = preset;
        ticks.forEach((t, i) => gsap.to(t, { scaleX: i === idx ? 2.4 : 1, backgroundColor: i === idx ? '#aee4be' : '#ffffff1f', duration: 0.4 }));
      }
    }
  });

  // Mobile fallback: stack vertically, no pin
  ScrollTrigger.matchMedia({
    '(max-width: 767px)': () => {
      ScrollTrigger.getAll().filter(st => st.trigger === pin).forEach(st => st.kill());
      if (track) { track.style.flexDirection = 'column'; track.style.position = 'static'; track.style.transform = 'none'; }
      if (pin) pin.style.height = 'auto';
      panels.forEach(p => { p.style.width = '100vw'; p.style.height = '100vh'; });
    }
  });

  window.addEventListener('keydown', (e) => {
    const active = document.activeElement;
    const inPin = pin?.contains(active as Node);
    if (!inPin && e.target !== document.body) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const direction = e.key === 'ArrowRight' ? 1 : -1;
      const st = ScrollTrigger.getAll().find(x => x.trigger === pin);
      if (!st) return;
      const progress = st.progress;
      const target = Math.max(0, Math.min(1, progress + direction * (1 / (total - 1))));
      const scrollPos = st.start + (st.end - st.start) * target;
      window.scrollTo({ top: scrollPos, behavior: 'smooth' });
      e.preventDefault();
    }
  });
}

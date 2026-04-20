import { gsap, ScrollTrigger, registerGSAP } from '../registerGSAP';

export function initGlobalMap() {
  registerGSAP();
  const section = document.querySelector('[data-section="global-map"]') as HTMLElement | null;
  if (!section) return;

  ScrollTrigger.create({
    trigger: section,
    start: 'top 65%',
    once: true,
    onEnter: () => {
      const lines = gsap.utils.toArray<SVGPathElement>('[data-map-line]');
      const dots  = gsap.utils.toArray<SVGCircleElement>('[data-map-dot]');
      lines.forEach((line, i) => {
        gsap.to(line, { strokeDashoffset: 0, duration: 1.1, delay: i * 0.18, ease: 'power2.inOut' });
        gsap.to(dots[i],  { opacity: 1, duration: 0.3, delay: i * 0.18 + 0.9 });
        gsap.fromTo(dots[i], { scale: 0.4, transformOrigin: 'center center' }, { scale: 1.4, duration: 0.25, delay: i * 0.18 + 0.9, yoyo: true, repeat: 1 });
      });
      (window as any).__flow?.setPreset('map', 1200);
    }
  });
}

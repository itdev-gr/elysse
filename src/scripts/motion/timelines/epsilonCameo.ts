import { gsap, ScrollTrigger, registerGSAP } from '../registerGSAP';

export function initEpsilonCameo() {
  registerGSAP();
  const section = document.querySelector('[data-section="epsilon-cameo"]') as HTMLElement | null;
  if (!section) return;

  const idle = gsap.to('[data-cameo-stage] svg', { rotate: 360, duration: 40, repeat: -1, ease: 'none' });

  ScrollTrigger.create({
    trigger: section,
    start: 'top 70%',
    end: 'bottom 30%',
    scrub: 0.6,
    animation: gsap.timeline()
      .from('[data-cameo-part="body"]',   { scale: 1.2, opacity: 0, duration: 1 }, 0)
      .from('[data-cameo-part="oring"]',  { scale: 0.5, opacity: 0, duration: 1 }, 0.2)
      .from('[data-cameo-part="collet"]', { x: -100, opacity: 0, duration: 1 }, 0.4)
      .from('[data-cameo-part="insert"]', { x: 100, opacity: 0, duration: 1 }, 0.6)
      .from('[data-cameo-part="nut"]',    { y: -60, opacity: 0, duration: 1 }, 0.8)
  });

  ScrollTrigger.create({
    trigger: section,
    start: 'top 60%',
    end: 'bottom 40%',
    onEnter:     () => (window as any).__flow?.setPreset('epsilon', 1000),
    onLeaveBack: () => (window as any).__flow?.setPreset('industry', 800)
  });
}

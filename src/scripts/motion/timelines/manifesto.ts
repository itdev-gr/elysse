import { gsap, ScrollTrigger, registerGSAP } from '../registerGSAP';

export function initManifesto() {
  registerGSAP();
  const wrap = document.querySelector('[data-manifesto-wrap]') as HTMLElement;
  if (!wrap) return;

  ScrollTrigger.create({
    trigger: wrap,
    start: 'top top',
    end: '+=150%',
    pin: true,
    scrub: 0.8,
    onEnter:       () => gsap.to(wrap,  { backgroundColor: '#f2ede3', color: '#0a1410', duration: 0.6 }),
    onLeave:       () => gsap.to(wrap,  { backgroundColor: '#0a1410', color: '#f2ede3', duration: 0.6 }),
    onEnterBack:   () => gsap.to(wrap,  { backgroundColor: '#f2ede3', color: '#0a1410', duration: 0.6 }),
    onLeaveBack:   () => gsap.to(wrap,  { backgroundColor: '#0a1410', color: '#f2ede3', duration: 0.6 }),
    animation: gsap.timeline()
      .to('[data-mword]', { opacity: 1, stagger: { amount: 1 } }, 0)
      .to('[data-manifesto-wave]', { strokeDashoffset: 0, duration: 1, ease: 'none' }, 0)
  });

  // Hook to particleFlow (if available): shift preset on enter/leave
  ScrollTrigger.create({
    trigger: wrap,
    start: 'top 60%',
    end: 'bottom 40%',
    onEnter: () => (window as any).__flow?.setPreset('counters', 1200),
    onLeaveBack: () => (window as any).__flow?.setPreset('hero', 800)
  });
}

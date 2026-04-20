import { gsap, registerGSAP } from '../registerGSAP';

export function playHero() {
  registerGSAP();
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to('[data-section="hero"] .mono', { opacity: 1, y: 0, duration: 0.6 }, 0)
    .to('[data-section="hero"] [data-word]', { y: 0, duration: 1.0, stagger: 0.08 }, 0.15)
    .from('[data-hero-scrollhint]', { scaleY: 0, duration: 0.8, ease: 'power2.inOut' }, '-=0.4');
  return tl;
}

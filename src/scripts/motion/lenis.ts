import Lenis from 'lenis';
import { gsap, ScrollTrigger, registerGSAP } from './registerGSAP';
import { prefersReducedMotion } from '~/scripts/utils/reducedMotion';

let lenis: Lenis | null = null;

export function initLenis(): Lenis | null {
  if (typeof window === 'undefined') return null;
  if (prefersReducedMotion()) return null;
  if (lenis) return lenis;

  registerGSAP();

  lenis = new Lenis({ duration: 1.1, easing: (t: number) => 1 - Math.pow(2, -10 * t), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

export function getLenis(): Lenis | null { return lenis; }

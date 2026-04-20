import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Observer } from 'gsap/Observer';
import { Flip } from 'gsap/Flip';

let registered = false;

export function registerGSAP() {
  if (registered || typeof window === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger, Observer, Flip);
  registered = true;
}

export { gsap, ScrollTrigger, Observer, Flip };

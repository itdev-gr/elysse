import { gsap, ScrollTrigger, registerGSAP } from '../registerGSAP';

export function initContactFooter() {
  registerGSAP();
  const section = document.querySelector('[data-section="contact"]') as HTMLElement | null;
  if (!section) return;

  ScrollTrigger.create({
    trigger: section,
    start: 'top 70%',
    once: true,
    onEnter: () => {
      gsap.from('[data-contact-headline] span', { y: '100%', opacity: 0, stagger: 0.08, duration: 0.9, ease: 'expo.out' });
    }
  });

  const marquee = document.querySelector('[data-footer-marquee]') as HTMLElement | null;
  if (marquee) {
    gsap.to(marquee, {
      xPercent: -50, duration: 30, ease: 'none', repeat: -1
    });
    ScrollTrigger.create({
      trigger: marquee,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const velocity = Math.min(10, Math.abs(self.getVelocity() / 200));
        gsap.to(marquee, { timeScale: 1 + velocity, duration: 0.3, overwrite: 'auto' });
      }
    });
  }
}

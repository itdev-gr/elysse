import { ScrollTrigger, registerGSAP } from '../registerGSAP';
import { tweenNumber, formatNumber } from '~/scripts/utils/counter';

export function initCounters() {
  registerGSAP();
  const nodes = document.querySelectorAll<HTMLElement>('[data-counter]');

  nodes.forEach(el => {
    const target = Number(el.dataset.target ?? '0');
    const suffix = el.dataset.suffix ?? '';
    ScrollTrigger.create({
      trigger: el,
      start: 'top 70%',
      once: true,
      onEnter: () => {
        tweenNumber({
          from: 0, to: target, duration: 1800,
          onUpdate: v => { el.textContent = formatNumber(v, { suffix }); }
        });
      }
    });
  });

  const section = document.querySelector('[data-section="counters"]');
  if (section) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 70%',
      end: 'bottom 30%',
      onEnter:     () => (window as any).__flow?.setPreset('counters', 1000),
      onLeaveBack: () => (window as any).__flow?.setPreset('epsilon', 800)
    });
  }
}

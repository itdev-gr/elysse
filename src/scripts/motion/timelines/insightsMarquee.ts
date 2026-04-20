import { Observer, registerGSAP } from '../registerGSAP';

export function initInsightsMarquee() {
  registerGSAP();
  const track = document.querySelector('[data-insights-track]') as HTMLElement | null;
  if (!track) return;

  let dragging = false;
  let startX = 0;
  let startScroll = 0;

  Observer.create({
    target: track,
    type: 'pointer,touch',
    onPress: (self) => {
      dragging = true;
      startX = self.x ?? 0;
      startScroll = track.scrollLeft;
      track.style.cursor = 'grabbing';
    },
    onDrag: (self) => {
      if (!dragging) return;
      track.scrollLeft = startScroll - ((self.x ?? 0) - startX);
    },
    onRelease: () => {
      dragging = false;
      track.style.cursor = 'grab';
    }
  });
}

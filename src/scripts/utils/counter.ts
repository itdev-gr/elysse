export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function interpolate(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export interface FormatOptions { suffix?: string }
export function formatNumber(value: number, opts: FormatOptions = {}): string {
  const rounded = Math.round(value);
  const str = rounded.toLocaleString('en-US');
  return opts.suffix ? `${str}${opts.suffix}` : str;
}

export interface TweenOptions {
  from: number;
  to: number;
  duration: number;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}

export function tweenNumber({ from, to, duration, onUpdate, onComplete }: TweenOptions): () => void {
  const start = performance.now();
  let rafId = 0;
  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    onUpdate(interpolate(from, to, easeOutExpo(t)));
    if (t < 1) rafId = requestAnimationFrame(frame);
    else onComplete?.();
  };
  rafId = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(rafId);
}

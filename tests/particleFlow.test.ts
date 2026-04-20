import { describe, it, expect } from 'vitest';
import { PRESETS, lerpPreset } from '~/scripts/motion/particleFlow';

describe('particle flow presets', () => {
  it('defines all 8 named presets', () => {
    expect(Object.keys(PRESETS).sort()).toEqual([
      'agri', 'building', 'counters', 'epsilon', 'hero', 'industry', 'landscape', 'map'
    ]);
  });

  it('each preset has required fields', () => {
    for (const key of Object.keys(PRESETS)) {
      const p = PRESETS[key as keyof typeof PRESETS];
      expect(p.color1).toBeInstanceOf(Array);
      expect(p.color1).toHaveLength(3);
      expect(typeof p.flowStrength).toBe('number');
      expect(typeof p.density).toBe('number');
    }
  });

  it('lerpPreset at t=0 returns from, at t=1 returns to', () => {
    const a = PRESETS.hero; const b = PRESETS.agri;
    const at0 = lerpPreset(a, b, 0);
    const at1 = lerpPreset(a, b, 1);
    expect(at0.flowStrength).toBe(a.flowStrength);
    expect(at1.flowStrength).toBe(b.flowStrength);
  });
});

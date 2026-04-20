# Adding a new particle field preset

The particle flow field reads from `PRESETS` in `src/scripts/motion/particleFlow.ts`. To add a new preset:

1. Pick a name (e.g., `marine`). Add to `PRESETS`:
   ```ts
   marine: { color1: [0.02, 0.05, 0.10], color2: [0.27, 0.52, 0.58], flowStrength: 0.22, density: 4.0, speed: 0.7 }
   ```
2. Update the type `Record<string, FlowPreset>` — no change needed if you keep the index signature generic.
3. Call from a section timeline:
   ```ts
   (window as any).__flow?.setPreset('marine', 1000);
   ```

Tuning:
- `flowStrength` → how curled the field is (0.0–0.4)
- `density` → how many particles per screen (2–8)
- `speed` → motion rate (0.3–2.0)
- `color1` → background fade
- `color2` → particle color

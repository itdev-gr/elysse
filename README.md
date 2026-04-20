# Elysee Irrigation — Site

Awwwards-tier Astro redesign for Elysee Irrigation Ltd. Homepage + Products index + Epsilon deep-dive.

## Tech

- Astro 5 · Tailwind v4 · GSAP 3 · OGL · Lenis · MDX · Vitest

## Dev

```bash
npm install
npm run dev       # http://localhost:4321
npm run build
npm run preview
npm run test
npm run check
```

## Structure

See `docs/superpowers/plans/2026-04-20-elysee-redesign.md` for the detailed plan and `docs/superpowers/specs/2026-04-20-elysee-redesign-design.md` for the design spec.

Key directories:

- `src/pages/` — entry routes
- `src/components/sections/` — one file per homepage act
- `src/scripts/motion/timelines/` — one file per orchestrated scene
- `src/content/` — MDX collections (products, sectors, insights)
- `src/styles/tokens.css` — design tokens (colors, type, grid)

## GSAP Club plugins

This project uses native GSAP plugins only (ScrollTrigger, Observer, Flip). It does NOT require a Club license. If you want premium SplitText or DrawSVG, install `gsap@npm:@gsap/premium` instead of `gsap`, then register those plugins in `src/scripts/motion/registerGSAP.ts`.

## Fonts

Fraunces (variable), Inter Tight (variable), JetBrains Mono (variable) — all OFL, free for commercial use. Stored at `public/fonts/`.

## Adding content

- New product → `docs/ADDING-A-PRODUCT.md`
- New sector / preset for particle field → `docs/ADDING-A-SECTOR-PRESET.md`
- Design tokens → `docs/TOKENS.md`

## Out of scope (future)

- i18n (GR/DE/ES)
- CMS wiring (Sanity/Contentful)
- Contact form backend
- Cookie consent
- About / Green Elysée / Innovation / Insights-detail pages

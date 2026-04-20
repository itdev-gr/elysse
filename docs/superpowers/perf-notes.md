# Performance notes — built at 2026-04-20

## Compression integration

`astro-compress` installed and wired into `astro.config.mjs` with options:
`{ HTML: true, CSS: true, JavaScript: true, SVG: true, Image: false }`

Build output confirms compression ran successfully:

- 4 HTML files compressed (~2.25–3.26% reduction each, ~2 KB total)
- 1 CSS file compressed (0.65% reduction, 201 Bytes)
- 6 JS files compressed (notable: registerGSAP -1.96 KB / 1.44% reduction)

## Build size

| File | Size (minified on disk) |
|------|------------------------|
| `dist/index.html` | 28 KB |
| `dist/products/index.html` | 20 KB |
| `dist/products/epsilon/index.html` | 14 KB |

## Bundle analysis — `dist/_astro/*.js`

| Chunk | On disk | gzip (Vite report) |
|-------|---------|-------------------|
| `registerGSAP.ClC6Qi8J.js` (GSAP + OGL + Lenis) | 135 KB | 54.56 kB |
| `ParticleFlow.astro_…Cy6IqDLq.js` | 48 KB | 14.73 kB |
| `Base.astro_…BbzP-wxJ.js` | 18 KB | 5.24 kB |
| `index.astro_…BydkJB8U.js` (homepage motion) | 5.9 KB | 2.22 kB |
| `epsilon.astro_…BbkSpIxB.js` | 2.2 KB | 0.91 kB |
| `Cursor.astro_…D9sqIrPG.js` | 907 B | 0.49 kB |
| `index.astro_…B_xIVBJF.js` | 691 B | 0.43 kB |
| `reducedMotion.DCcCguZk.js` | 118 B | 0.12 kB |

Total _astro JS (on disk): ~210 KB | gzip total: ~78.7 kB

## Explicit img dimensions added

All 5 audited img tags now carry `width` and `height` to prevent CLS:

| Component | Dimensions |
|-----------|-----------|
| `src/components/products/ProductCard.astro` | 800 × 1000 |
| `src/components/sections/FourWorlds.astro` | 900 × 1200 |
| `src/components/sections/Insights.astro` | 1200 × 900 |
| `src/pages/products/epsilon.astro` (e4 installation frames) | 900 × 1200 |
| `src/pages/products/epsilon.astro` (related products) | 800 × 1000 |

CSS `w-full h-full object-cover` and the surrounding aspect-ratio containers control actual rendered size; these attributes only provide the browser a shape to reserve space before image load.

## Build + check results

`npm run build` — complete in 2.28s, 4 pages built, no errors.
`npm run check` — 0 errors, 0 warnings, 3 pre-existing hints (unrelated to this task).

## Follow-up: Lighthouse (manual step)

A full Lighthouse run requires Chrome/Chromium and cannot be automated here.
To run manually after `npm run preview`:

```bash
npx lighthouse http://localhost:4321 --output html --output-path ./lighthouse-report.html
```

Or use Chrome DevTools → Lighthouse tab against the preview server.
Target: Performance >= 95, CLS < 0.1, LCP < 2.5s.

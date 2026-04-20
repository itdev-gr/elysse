# Elysee Irrigation — Modern Redesign Spec

**Status:** Approved for planning
**Date:** 2026-04-20
**Scope:** Showcase template (Homepage + Products index + Epsilon deep-dive)
**Stack:** Astro · Tailwind v4 · GSAP (+ Club plugins) · OGL · Lenis · MDX

---

## 1. Project context

**Client.** Elysee Irrigation Ltd. — industrial B2B plastic piping & fittings manufacturer, founded 1979, based in Cyprus, present in 65+ countries with 5,000+ product codes across Agriculture, Landscape, Building & Infrastructure, and Industry sectors. Existing site: https://elysee.com.cy/en.

**Brief.** Build a "€10,000-tier" modern redesign as a showcase template — not an AI-generic layout. Three pages polished to Awwwards-tier execution. Deliverables hand off to the client as an Astro project the team can extend.

**Goal.** Produce a design that feels confidently crafted — cinematic typography, GSAP-sequenced scroll choreography, a custom WebGL hero — while remaining performant, accessible, and maintainable.

**Out of scope.** Multi-language (EN only for this phase), CMS wiring, real blog/insights data, cookie banner, contact form backend. These are documented as future work.

---

## 2. Design direction

Chosen territory: **Cinematic Bold** — magazine-cover, award-show scale. Deep forest canvas, large serif display, GSAP-heavy choreography.

### 2.1 Voice

Short, declarative, lyrical. Technical passages counterbalance with monospaced engineering data (pressure, bore, standards). Tagline retained: *"Streaming water. Streaming life."*

### 2.2 Color palette

| Token | Hex | Role |
|---|---|---|
| `--surface-deep` | `#0a1410` | Page canvas (default) |
| `--surface-relief` | `#0d1f16` | Pinned section lift |
| `--surface-break` | `#f2ede3` | One dramatic light inversion (Manifesto only) |
| `--text-primary` | `#f2ede3` | Body on dark |
| `--text-secondary` | `#a8c4b2` | Subdued body on dark |
| `--text-mono` | `#7eb08c` | Monospace labels, specs |
| `--accent-bright` | `#aee4be` | Hover, live state, emphasis |
| `--accent-primary` | `#7eb08c` | Primary brand green |
| `--accent-deep` | `#3d6b52` | Secondary green, hairlines |
| `--accent-water` | `#6fb8c2` | Data chips / hover only, used sparingly |
| `--hairline` | `rgba(242,237,227,0.12)` | Dividers, borders |

All dark-canvas text maintains ≥ 4.5:1 contrast; large display ≥ 3:1.

### 2.3 Typography

| Role | Family | Notes |
|---|---|---|
| Display | **Fraunces** (variable: `opsz`, `slnt`, `SOFT`) | Italic axis animated (0 → -10) on hover emphasis |
| Body | **Inter Tight** | 400 / 500 / 600 |
| Mono / spec | **JetBrains Mono** | 10-12px, letter-spacing 0.18em uppercase for labels |

Display size ramp: 180px (hero), 140px (section titles), 96px (E-series act headers), 48px (card titles), 22px (body-adjacent titles).
Self-hosted, subset to Latin + Latin-Ext, `font-display: swap`, preload 2 critical weights (Fraunces 500, Inter Tight 400).

### 2.4 Grid & spacing

- Desktop: 12 columns, 24px gutters, 1440px max-width container, 80px side margin.
- Tablet (≥ 768): 8 columns, 20px gutters, 48px margin.
- Mobile (< 768): 4 columns, 16px gutters, 24px margin.
- Vertical rhythm on 8px base. Section padding: 160 / 96 / 64 (desktop / tablet / mobile).

### 2.5 Imagery & motion

- **Hero + every section:** fixed full-viewport particle flow field (OGL, ~7kb) behind content. Uniforms tween per section — each scene has a named preset (`agri`, `landscape`, `building`, `industry`, `counters`, `map`). Single `<canvas>`, re-colored rather than re-mounted.
- **Product imagery:** Elysee's real product photos (compression fittings, Epsilon series, valves). Treated editorially — clipped shapes, generous negative space.
- **Epsilon 3D:** low-poly OGL mesh built from reference photos — body / o-ring / collet / insert / nut.
- **Environmental imagery:** curated cinematic photography (agricultural fields, water macro, industrial details) licensed via Unsplash/Pexels. Color-graded to the palette on import.

### 2.6 Iconography & custom elements

- Bespoke 1px-stroke icons for nav and category chips. No off-the-shelf icon pack.
- Custom cursor on desktop: small bright-green dot, scales up near interactive elements, fills to a ring on hover.

---

## 3. Technical architecture

### 3.1 Stack decisions

- **Framework:** Astro 5.x, view transitions enabled.
- **Styling:** Tailwind v4 + design tokens in `tokens.css`. Tailwind is a utility layer; tokens drive all colors / spacing / type.
- **Motion:** GSAP 3.x with Club plugins — ScrollTrigger, SplitText, DrawSVG, Flip, Observer. (If Club license is unavailable at implementation time, substitutes: GSAP's native `SplitText` (v3.13+), a custom `drawSVG` utility using `stroke-dasharray`, manual `clip-path` animations for Flip effects. Noted in README.)
- **Scroll:** Lenis v1.x, integrated with ScrollTrigger via `scrollerProxy`. Respects `prefers-reduced-motion` — Lenis disabled, pins become static layout stacks, all `scrub` becomes instant fade.
- **WebGL:** OGL (~7kb). One shared canvas component, uniforms driven via GSAP quickTo.
- **Content:** Astro MDX collections for products (`src/content/products/`), sectors (`src/content/sectors/`), insights (`src/content/insights/`). 4 sample insights as placeholders.

### 3.2 File structure

```
elysse/
├─ astro.config.mjs
├─ tailwind.config.ts
├─ package.json
├─ public/
│  ├─ fonts/            (subset woff2 files)
│  ├─ og/               (social cards)
│  └─ favicon.svg
├─ src/
│  ├─ pages/
│  │  ├─ index.astro             → Homepage
│  │  ├─ products/
│  │  │  ├─ index.astro          → Products category grid
│  │  │  └─ epsilon.astro        → Epsilon deep-dive
│  │  └─ 404.astro
│  ├─ layouts/
│  │  └─ Base.astro              → Lenis, GSAP registration, <Meta>, <Nav>, <Footer>
│  ├─ components/
│  │  ├─ hero/
│  │  │  ├─ ParticleFlow.astro   (OGL canvas island, client:visible)
│  │  │  └─ SplitHeadline.astro  (SplitText wrapper)
│  │  ├─ sections/
│  │  │  ├─ Hero.astro
│  │  │  ├─ Manifesto.astro
│  │  │  ├─ FourWorlds.astro
│  │  │  ├─ EpsilonCameo.astro
│  │  │  ├─ Counters.astro
│  │  │  ├─ GlobalMap.astro
│  │  │  ├─ Insights.astro
│  │  │  └─ ContactFooter.astro
│  │  ├─ products/
│  │  │  ├─ ProductCard.astro
│  │  │  ├─ FilterRail.astro
│  │  │  └─ EpsilonStage.astro   (3D fitting + scroll orchestration)
│  │  ├─ ui/
│  │  │  ├─ Nav.astro
│  │  │  ├─ Cursor.astro
│  │  │  ├─ Marquee.astro
│  │  │  ├─ Button.astro
│  │  │  ├─ SpecTag.astro
│  │  │  └─ Meta.astro
│  │  └─ motion/
│  │     ├─ ReducedMotionGate.astro
│  │     └─ ScrollTriggerInit.client.ts
│  ├─ scripts/
│  │  └─ motion/
│  │     ├─ registerGSAP.ts
│  │     ├─ lenis.ts
│  │     ├─ particleFlow.ts      (OGL shader + uniforms API)
│  │     └─ timelines/
│  │        ├─ hero.ts
│  │        ├─ manifesto.ts
│  │        ├─ fourWorlds.ts
│  │        ├─ epsilonCameo.ts
│  │        ├─ counters.ts
│  │        ├─ globalMap.ts
│  │        ├─ insightsMarquee.ts
│  │        ├─ contactFooter.ts
│  │        └─ epsilonPage.ts
│  ├─ content/
│  │  ├─ config.ts               (collections schema)
│  │  ├─ products/
│  │  │  └─ *.mdx                (8–10 sample products incl. Epsilon)
│  │  ├─ sectors/
│  │  │  └─ {agriculture,landscape,building,industry}.mdx
│  │  └─ insights/
│  │     └─ *.mdx                (4 sample entries)
│  ├─ styles/
│  │  ├─ tokens.css              (CSS custom properties)
│  │  ├─ typography.css
│  │  ├─ reset.css
│  │  └─ tailwind.css
│  ├─ data/
│  │  ├─ nav.ts
│  │  ├─ stats.ts                (46 / 5000 / 65)
│  │  └─ globalMap.ts            (subsidiary coordinates)
│  └─ assets/
│     ├─ images/                 (product + environmental)
│     └─ textures/               (particle field noise textures)
└─ docs/
   └─ superpowers/specs/…
```

### 3.3 Hydration strategy

Astro islands, minimal JS by default. Hydrate only:

- `ParticleFlow.astro` → `client:idle` (defers hydration until browser idle, guaranteeing LCP text paints first).
- Section motion scripts (`timelines/*.ts`) loaded as a single motion bundle via one `<script type="module">` in `Base.astro`, executed on `DOMContentLoaded` **after** LCP-critical paint.
- Custom cursor → `client:idle`.
- Insights marquee + Epsilon page interactive bits → `client:visible`.

Target: < 120KB gz of JS on homepage after tree-shaking.

### 3.4 Data flow

- Static MDX collections compiled at build.
- Sectors / products / insights loaded at render as props; components remain presentational.
- Motion timelines read DOM via data attributes (`data-motion="hero"`) — no tight coupling with Astro components.

---

## 4. Homepage — 8 acts

Full page length ≈ 1,200vh. Particle canvas persists across all acts (position: fixed).

### 4.1 Act 01 · Hero (100vh)

**Visual.** Deep forest canvas; particle flow active with `preset: hero`. Display headline center-left: *"The flow / of growth."* with italic "flow" in accent-bright. Mono subline: `ELYSEE · SINCE 1979 · 65 COUNTRIES`. Vertical scroll-hint line at bottom-right.

**Motion.**
```
tlHero
  .from('.hero-word', {y:'100%', opacity:0, stagger:0.08, duration:0.9, ease:'expo.out'})
  .from('.hero-subline', {opacity:0, y:12, duration:0.6}, '-=0.4')
  .to('.hero-scrollhint-line', {scaleY:1, duration:0.8, ease:'power2.inOut'}, '-=0.3')
```

**Hover states.** Mouse-move curls particle field toward cursor (lerped). Italic "flow" slowly shifts slnt axis on hover (-8 → -12 deg).

### 4.2 Act 02 · Manifesto (pinned 150vh, scrubbed)

**Visual.** Background cross-fades from `--surface-deep` to `--surface-break` — the one dramatic light moment. Full-bleed paragraph in Fraunces 96px, ~5 lines: *"Since 1979, we've built systems that carry water — and everything water carries. Through fields and cities, factories and gardens, across 65 countries. A quieter kind of infrastructure, built to last."*

Hairline SVG waveform crosses behind the text, DrawSVG-animated on scroll.

**Motion.**
```
tlManifesto
  .to('body', {'--surface-deep': '#f2ede3'}, 0)          // cross-fade via CSS var
  .from('.manifesto-word', {opacity:0.15, stagger:{amount:0.8}}, 0)
  .to('.manifesto-wave path', {drawSVG:'100%'}, 0)
ScrollTrigger: {pin: true, scrub: 0.8, start:'top top', end:'+=150%'}
```

On exit, CSS var tweens back to deep. Particle uniforms shift color toward greener.

### 4.3 Act 03 · Four Worlds (pinned 400vh, horizontal)

**Visual.** Headline pins top: *"Four worlds, one flow."* Four panels scroll horizontally: **Agriculture · Landscape · Building · Industry**. Each panel: 220px Fraunces sector label, hero product/scene image in irregular clip-path, mono spec list (e.g. `DRIP · SPRINKLER · FLOW CONTROL`), "Explore →" pill.

Progress indicator: 4 hairline ticks, current tick expands.

**Motion.**
```
tlFourWorlds
  .to('.worlds-track', {xPercent:-300, ease:'none'})   // horizontal
  .to(particleField, {preset:'agri'→'landscape'→'building'→'industry'}, 0)
  .to('.worlds-tick', {staggered expansion matching panel index}, 0)
ScrollTrigger: {pin:true, scrub:0.5, end:'+=400%', anticipatePin:1}
```

**Keyboard.** Arrow keys snap-advance between panels (GSAP Observer listens for key events).

### 4.4 Act 04 · Epsilon Cameo (120vh)

**Visual.** Dark. Center: low-poly 3D Epsilon fitting (OGL mesh with matcap-like fake lighting), slow idle rotation. On scroll, 5 components fan out along staggered axes with DrawSVG callout lines: `1. BODY · 2. O-RING · 3. COLLET · 4. INSERT · 5. NUT`. Headline right: *"Engineered to fit."* CTA → `/products/epsilon`.

**Motion.** Single scrubbed master timeline orchestrating uniform updates on the fitting mesh + DrawSVG on callouts + opacity of labels.

### 4.5 Act 05 · Counters (100vh)

**Visual.** Three columns, each with giant Fraunces number: **46 · 5,000+ · 65**. Manifesto line + mono caption below each.

**Motion.** `gsap.to({val:0}, {val:targetNumber, duration:2, onUpdate: updateTextNode, ease:'expo.out'})` driven by ScrollTrigger `start:'top 70%'`. Particle field shifts to `counters` preset — droplets trail between columns.

### 4.6 Act 06 · Global Reach (100vh)

**Visual.** Dark equirectangular world map (SVG, stylized, no country detail beyond silhouettes). Dots mark subsidiaries/markets. Flow-lines animate HQ (Cyprus) → markets in sequence via DrawSVG. Mono ticker below: `HQ CYPRUS · EGYPT · GERMANY · SPAIN · …`.

**Motion.** Sequential DrawSVG on `.map-flow-line` elements, staggered by geographic proximity. Dots pulse (scale 1 → 1.4 → 1) as their line completes.

### 4.7 Act 07 · Insights (80vh)

**Visual.** Horizontal marquee of 3-4 editorial tiles (latest news / blog / exhibition). Each tile: cover image (clip-path reveal on hover), headline, mono date tag.

**Motion.** GSAP Observer drag-to-scroll with inertia. Hover tilt ±3deg max (translate3d + rotateY). Velocity-reactive: faster scroll = slight image skew.

### 4.8 Act 08 · Contact Footer (90vh)

**Visual.** Oversized *"Let's make things grow."* (180px, ~50vh). Contact info grid: address, phones/email, social. At very bottom, scroll-velocity-reactive marquee of `ELYSEE` wordmark repeated. Legal fine print.

**Motion.** Headline word-stagger on enter. Marquee x-position driven by scroll velocity (`ScrollTrigger.getVelocity()` → `gsap.quickTo`).

---

## 5. `/products` — Category index (~350vh)

### 5.1 Hero strip (60vh)

Oversized header *"Products."* + subline `5,000+ CODES · 4 SECTORS`. Particle canvas pinned to `industry` preset.

### 5.2 Filter rail (sticky, left on desktop; top drawer on mobile)

Pill filters: *All · Compression Fittings · PVC Ball Valves · Saddles · Adaptor Flanged Sets · Couplings · Valves*. Active = DrawSVG underline animating between filters (shared layout transition).

### 5.3 Product grid (right, asymmetric bento, 3-col desktop)

Each card:

- Clipped product image with 5% parallax on scroll.
- Mono category tag, product name (Fraunces 22px), 1-line blurb.
- Hover: lift 8px, mono spec chips reveal (`16 bar · PN16 · 20-110mm`), image zoom 1.05×.
- **Featured (Epsilon):** 2× size, `FEATURED` mono ribbon.

**Filter interaction.** `gsap.Flip.from(state, {duration:0.6, ease:'expo.inOut'})` — cards reshuffle with FLIP transitions; non-matches fade + drop to a "not included" row.

### 5.4 Footer band

*"Not sure which fitting fits?"* + contact pill → anchor to homepage contact footer (cross-page, uses view transitions).

---

## 6. `/products/epsilon` — Flagship deep-dive (~700vh)

Five acts, fully orchestrated. Particle canvas remains — uniforms set to a dedicated `epsilon` preset (narrower flow, more directional).

### 6.1 E1 · Reveal (100vh)

Black on mount. Headline typewrites character by character: *ε · EPSILON SERIES*. 3D fitting fades in center, idle rotation. Subline: *"Compression fittings for PE pipes. Ø20–Ø110. PN16."*

### 6.2 E2 · Disassembly (pinned 300vh, scrubbed)

**The centerpiece.** Scroll drives 5 components exploding along staggered axes with DrawSVG callout lines:

1. BODY — radial out
2. O-RING — axial, inner piece
3. COLLET — axial, grip ring
4. INSERT — axial, internal sleeve
5. NUT — axial, terminal cap

Each label typewriter-reveals when its component reaches its terminal position. Reverse scroll re-assembles.

**Implementation.** Single master timeline, `ScrollTrigger({pin:true, scrub:0.5, end:'+=300%'})`. Component transforms driven by OGL uniforms (no per-frame DOM thrash).

### 6.3 E3 · Spec panel (100vh)

Two columns. Left: locked still of fitting. Right: spec table (mono), rows stagger-reveal (y + opacity, stagger 0.06). Download CTAs: `Datasheet · Installation · BIM · 3D CAD` with icon mask-reveal on hover.

### 6.4 E4 · Installation film (120vh, pinned)

Pinned "film strip" of 4 installation steps. Scroll drives which frame is active; non-active dim to 40%. Each frame: image (GSAP Flip between stills — avoids video weight), mono caption. Captions cross-fade.

### 6.5 E5 · Compatible products + terminal CTA (100vh)

Horizontal carousel of related SKUs (Observer drag, same card language as `/products`). Terminal CTA: *"Talk to our engineers →"* → homepage contact footer anchor.

---

## 7. Global components

### 7.1 Navigation

- Fixed top bar, 64px height, auto-hide on scroll-down (translateY(-100%)), reveal on scroll-up.
- Left: Elysee wordmark (Fraunces). Center: mono category links (`PRODUCTS · ABOUT · INSIGHTS · CONTACT`). Right: a single pill CTA (`Get in touch`).
- Mobile: hamburger → full-bleed overlay with staggered char reveals via SplitText.

### 7.2 Custom cursor (desktop only)

- Green 8px dot, mix-blend-mode: difference. Inertia via `gsap.quickTo`.
- On interactive-element hover: scales to 32px ring with label ("View", "Drag", "Explore") fade-in inside.
- Disabled when `prefers-reduced-motion` is set or touch device detected.

### 7.3 Footer

Reused across all pages. Same contact block as homepage Act 08, smaller marquee.

### 7.4 SpecTag component

Mono, 10px, letter-spacing 0.18em, uppercase. Used everywhere for category labels, spec chips, engineering callouts. Prop: `tone: 'neutral' | 'bright' | 'subtle'`.

### 7.5 Button component

Two variants:

- `primary`: pill, green border, hover fills with accent-bright, label animates (mask-reveal from bottom to top on hover).
- `arrow`: text + circled arrow, no border. Arrow rotates 45deg on hover.

### 7.6 Meta / SEO component

Props: `title`, `description`, `ogImage`, `canonical`, `schema`. Outputs all meta + JSON-LD.

---

## 8. Performance

| Metric | Target |
|---|---|
| LCP (4G, mid-range mobile) | < 2.0s |
| INP | < 200ms |
| CLS | < 0.05 |
| JS bundle (homepage, gz) | < 120 KB |
| Fonts (total subsets, gz) | < 80 KB |
| LCP image | preloaded AVIF, < 80 KB |

**Tactics.**

- Particle canvas hydrates via `client:idle` (browser idle = after LCP text paint). First-paint is pure HTML/CSS.
- Tree-shake GSAP — import only the plugins used, no wildcard import.
- All images: AVIF primary + WebP fallback, responsive `<picture>` with `sizes`.
- OGL imported as ES module, ~7KB minified.
- `@astrojs/compress` for HTML/CSS minification.
- No runtime CSS-in-JS.
- Fraunces variable font served as one file (all weights 100-900, `slnt` axis).

---

## 9. Accessibility

- **Motion.** `@media (prefers-reduced-motion: reduce)` — Lenis off, all `scrub: 0` (snap), pins become static section stacks, horizontal scroll stacks vertically, particle canvas replaced by a static low-opacity gradient.
- **Keyboard.** All interactive elements tab-reachable. Horizontal scroll section responds to ArrowLeft/ArrowRight (Observer listeners). Custom cursor does not block `:focus-visible` rings (2px bright-green outline, 3px offset).
- **Screen readers.** Semantic structure (`<main>`, `<nav>`, `<article>`, `<section aria-labelledby>`). Decorative animations marked `aria-hidden`. Each section has a visually-hidden heading. Horizontal "Four Worlds" exposes all four panels to the DOM regardless of scroll state.
- **Contrast.** Body text on dark ≥ 4.5:1; large display ≥ 3:1; accent-bright on `--surface-deep` verified ≥ 7:1.
- **Forms/links.** All anchors descriptive ("Explore Agriculture" not "click here"). `mailto:` and `tel:` links use proper schemes.

---

## 10. Content

All sample content lives in MDX collections so the client can edit without touching components.

**Collections:**

- `products/` — 8-10 entries. Required schema fields: `name, slug, category, image, specs (array of key/value), blurb, pressure, sizeRange, bim?, datasheet?`. Includes Epsilon as featured.
- `sectors/` — 4 entries (agriculture, landscape, building, industry). Schema: `name, slug, tagline, image, bullets[], accent`.
- `insights/` — 4 sample entries. Schema: `title, slug, date, excerpt, cover, tag`.

**Copy.** Drafted during implementation from existing elysee.com.cy copy where usable; refreshed for voice where not. The spec does not lock exact body copy — implementation-time decision, client-reviewable.

---

## 11. Delivery

### 11.1 Repo hygiene

- Git-initialized. `.gitignore` excludes `.superpowers/`, `node_modules/`, `dist/`, `.astro/`, `.env*`.
- README: dev/build commands, tokens inventory, "how to add a product" guide, "how to add a new sector preset to the particle field" guide, GSAP Club substitution notes.
- Commit convention: conventional commits (`feat:`, `fix:`, `chore:`).

### 11.2 Scripts

- `npm run dev` — Astro dev server
- `npm run build` — production build
- `npm run preview` — preview built site
- `npm run check` — `astro check` + tsc noEmit + tailwind build check

### 11.3 Handoff checklist

- [x] All three pages built and polished
- [x] Reduced-motion variant verified (code-audit pass across all 5 motion entry points; browser devtools not tested)
- [ ] Lighthouse ≥ 95 (perf / accessibility / SEO) on production build — **deferred, requires real browser run**
- [x] No console errors at build/check level; production browser console not tested
- [ ] Browser matrix tested: latest Safari, Chrome, Firefox; Safari iOS 17+; Chrome Android latest — **deferred, requires real browsers**
- [x] README complete
- [x] 8 products (including Epsilon), 4 sectors, 4 insights in MDX

> **Note:** Browser and Lighthouse items deferred — run manually before client sign-off.

---

## 12. Explicitly out of scope (documented future work)

- Multi-language (Greek / German / Spanish). Astro i18n routing planned but not wired; token for locale exists.
- CMS (Sanity / Contentful). Content structure is CMS-ready — collection schemas mirror typical headless shapes.
- Contact form backend (currently `mailto:`).
- Cookie consent / analytics.
- Real blog / insights content beyond 4 samples.
- About, Green Elysée, Innovation, Insights-detail pages — visual language is established, pages can extend the same components.

---

## 13. Risks & mitigations

| Risk | Mitigation |
|---|---|
| GSAP Club license absent on client side | Implement substitutes (native SplitText v3.13+, custom drawSVG via dash-offset, Flip via manual FLIP calc). Document in README. |
| 3D Epsilon model production time | Scope cap: 5-component low-poly reference from product photos, matcap-style shading, no PBR. Time-boxed 0.5-1 day. If overruns, fallback is a static rendered image with scroll-scrubbed parallax + drawn callouts (same visual impact, less engineering). |
| Particle canvas perf on low-end Android | Adaptive DPR (device-pixel-ratio capped at 1.5), particle count halves below 60fps via frame-time probe, disables entirely if < 30fps sustained for 3s. |
| Horizontal-scroll pin on mobile | On `< 768px`, replace pin with vertical stack of the four sector panels. No horizontal scroll at all — tested pattern, not a novelty. |
| Font license | Fraunces + Inter Tight + JetBrains Mono all OFL/SIL — free for commercial use. Documented in README. |

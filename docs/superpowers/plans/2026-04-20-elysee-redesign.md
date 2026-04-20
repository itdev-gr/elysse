# Elysee Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a three-page Astro showcase template for Elysee Irrigation — Homepage, Products index, Epsilon deep-dive — with cinematic GSAP sequencing and a shared WebGL particle flow canvas.

**Architecture:** Astro 5 static site with island hydration for motion components. Lenis smooth-scroll bridged to GSAP ScrollTrigger. A single OGL particle canvas persists across all sections, with uniforms tweened per scene. Content in MDX collections. Tailwind v4 for utilities + CSS custom properties for design tokens.

**Tech Stack:** Astro 5 · Tailwind v4 · GSAP 3 (ScrollTrigger, SplitText, DrawSVG, Flip, Observer) · OGL · Lenis · MDX · Fraunces/Inter Tight/JetBrains Mono · Vitest for unit tests

**Spec:** `docs/superpowers/specs/2026-04-20-elysee-redesign-design.md`

---

## Testing Philosophy

UI/animation projects don't respond to TDD uniformly. This plan uses three layers:

1. **Unit tests (Vitest):** pure JS utilities — particle uniform API, counter easing, ScrollTrigger helpers, data loaders. Written test-first.
2. **Type + build checks:** `astro check` and `astro build` act as integration tests. A task is not done if either fails.
3. **Manual browser verification:** every visual task ends with specific checks (DOM structure, console, motion behavior, reduced-motion variant). Explicit steps, not hand-waved.

Commit after every passing task.

---

## File Structure

```
elysse/
├─ .gitignore
├─ package.json
├─ astro.config.mjs
├─ tailwind.config.ts
├─ tsconfig.json
├─ vitest.config.ts
├─ README.md
├─ public/
│  ├─ fonts/                    (fraunces, inter-tight, jetbrains-mono subsets)
│  ├─ favicon.svg
│  └─ og/                       (social cards)
├─ src/
│  ├─ env.d.ts
│  ├─ pages/
│  │  ├─ index.astro
│  │  ├─ products/index.astro
│  │  ├─ products/epsilon.astro
│  │  └─ 404.astro
│  ├─ layouts/Base.astro
│  ├─ content/
│  │  ├─ config.ts
│  │  ├─ products/*.mdx
│  │  ├─ sectors/*.mdx
│  │  └─ insights/*.mdx
│  ├─ components/
│  │  ├─ hero/ParticleFlow.astro
│  │  ├─ hero/SplitHeadline.astro
│  │  ├─ sections/Hero.astro
│  │  ├─ sections/Manifesto.astro
│  │  ├─ sections/FourWorlds.astro
│  │  ├─ sections/EpsilonCameo.astro
│  │  ├─ sections/Counters.astro
│  │  ├─ sections/GlobalMap.astro
│  │  ├─ sections/Insights.astro
│  │  ├─ sections/ContactFooter.astro
│  │  ├─ products/ProductCard.astro
│  │  ├─ products/FilterRail.astro
│  │  ├─ products/EpsilonStage.astro
│  │  ├─ ui/Nav.astro
│  │  ├─ ui/Cursor.astro
│  │  ├─ ui/Marquee.astro
│  │  ├─ ui/Button.astro
│  │  ├─ ui/SpecTag.astro
│  │  └─ ui/Meta.astro
│  ├─ scripts/motion/
│  │  ├─ registerGSAP.ts
│  │  ├─ lenis.ts
│  │  ├─ particleFlow.ts
│  │  └─ timelines/
│  │     ├─ hero.ts
│  │     ├─ manifesto.ts
│  │     ├─ fourWorlds.ts
│  │     ├─ epsilonCameo.ts
│  │     ├─ counters.ts
│  │     ├─ globalMap.ts
│  │     ├─ insightsMarquee.ts
│  │     ├─ contactFooter.ts
│  │     ├─ productsFilter.ts
│  │     └─ epsilonPage.ts
│  ├─ scripts/utils/
│  │  ├─ counter.ts
│  │  ├─ reducedMotion.ts
│  │  └─ prefersPointer.ts
│  ├─ styles/
│  │  ├─ reset.css
│  │  ├─ tokens.css
│  │  ├─ typography.css
│  │  └─ tailwind.css
│  ├─ data/
│  │  ├─ nav.ts
│  │  ├─ stats.ts
│  │  └─ globalMap.ts
│  └─ assets/
│     ├─ images/
│     └─ shaders/
│        ├─ flow.vert
│        └─ flow.frag
└─ tests/
   ├─ counter.test.ts
   ├─ particleFlow.test.ts
   ├─ reducedMotion.test.ts
   └─ stats.test.ts
```

---

## Task 1: Scaffold Astro project & initialize git

**Files:**
- Create: `/Users/marios/Desktop/Cursor/elysse/.gitignore`
- Create: `/Users/marios/Desktop/Cursor/elysse/package.json`
- Create: `/Users/marios/Desktop/Cursor/elysse/astro.config.mjs`
- Create: `/Users/marios/Desktop/Cursor/elysse/tsconfig.json`
- Create: `/Users/marios/Desktop/Cursor/elysse/src/env.d.ts`
- Create: `/Users/marios/Desktop/Cursor/elysse/src/pages/index.astro`

- [ ] **Step 1: Initialize git**

```bash
cd /Users/marios/Desktop/Cursor/elysse
git init
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
dist/
.astro/
.env
.env.*
!.env.example
.DS_Store
.superpowers/
*.log
.vscode/
.idea/
coverage/
```

- [ ] **Step 3: Create `package.json`**

```json
{
  "name": "elysee",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check && tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/mdx": "^4.0.0",
    "@astrojs/sitemap": "^3.2.0",
    "@astrojs/check": "^0.9.0",
    "typescript": "^5.6.0",
    "gsap": "^3.13.0",
    "lenis": "^1.1.0",
    "ogl": "^1.0.10"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "vitest": "^2.1.0",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`
Expected: Install completes without peer-dep warnings that block.

- [ ] **Step 5: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://elysee.com.cy',
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    ssr: { noExternal: ['gsap', 'ogl', 'lenis'] }
  },
  experimental: { clientPrerender: true }
});
```

- [ ] **Step 6: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "~/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 7: Create `src/env.d.ts`**

```ts
/// <reference path="../.astro/types.d.ts" />
```

- [ ] **Step 8: Create minimal placeholder `src/pages/index.astro`**

```astro
---
---
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Elysee — Scaffold</title>
  </head>
  <body>
    <h1>Elysee scaffold</h1>
  </body>
</html>
```

- [ ] **Step 9: Verify dev server boots**

Run: `npm run dev`
Expected: Astro dev server starts at http://localhost:4321, placeholder page renders. Kill with Ctrl+C.

- [ ] **Step 10: Verify build works**

Run: `npm run build`
Expected: Build completes, `dist/` created, no errors.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: scaffold astro project with mdx, sitemap, tailwindcss, gsap, ogl, lenis"
```

---

## Task 2: Design tokens, reset, Tailwind v4 wiring

**Files:**
- Create: `src/styles/reset.css`
- Create: `src/styles/tokens.css`
- Create: `src/styles/typography.css`
- Create: `src/styles/tailwind.css`

- [ ] **Step 1: Create `src/styles/reset.css`**

```css
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; padding: 0; }
html, body { height: 100%; }
body {
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}
img, picture, video, canvas, svg { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; }
p, h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }
#root, #__next { isolation: isolate; }
a { color: inherit; text-decoration: none; }
button { background: none; border: 0; cursor: pointer; color: inherit; }
```

- [ ] **Step 2: Create `src/styles/tokens.css`**

```css
:root {
  /* Surfaces */
  --surface-deep: #0a1410;
  --surface-relief: #0d1f16;
  --surface-break: #f2ede3;

  /* Text */
  --text-primary: #f2ede3;
  --text-secondary: #a8c4b2;
  --text-mono: #7eb08c;

  /* Accents */
  --accent-bright: #aee4be;
  --accent-primary: #7eb08c;
  --accent-deep: #3d6b52;
  --accent-water: #6fb8c2;

  /* Utility */
  --hairline: rgba(242, 237, 227, 0.12);

  /* Type */
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Inter Tight', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;

  /* Grid */
  --container: 1440px;
  --gutter: 24px;
  --margin: 80px;

  /* Transition */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-cubic: cubic-bezier(0.65, 0, 0.35, 1);
}

@media (max-width: 1023px) { :root { --margin: 48px; --gutter: 20px; } }
@media (max-width: 767px)  { :root { --margin: 24px; --gutter: 16px; } }

html { background: var(--surface-deep); color: var(--text-primary); }
```

- [ ] **Step 3: Create `src/styles/typography.css`**

```css
@font-face {
  font-family: 'Fraunces';
  src: url('/fonts/fraunces-variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Inter Tight';
  src: url('/fonts/inter-tight-variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-display: swap;
}
@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/jetbrains-mono-variable.woff2') format('woff2-variations');
  font-weight: 100 800;
  font-display: swap;
}

body { font-family: var(--font-body); font-size: 16px; font-weight: 400; }
h1, h2, h3, h4 { font-family: var(--font-display); font-weight: 500; letter-spacing: -0.02em; line-height: 0.95; }
.mono { font-family: var(--font-mono); letter-spacing: 0.18em; text-transform: uppercase; font-size: 11px; color: var(--text-mono); }
.serif-italic { font-style: italic; font-variation-settings: "slnt" -8; color: var(--accent-bright); }

.display-xl { font-size: clamp(64px, 12vw, 180px); }
.display-lg { font-size: clamp(56px, 9vw, 140px); }
.display-md { font-size: clamp(40px, 6vw, 96px); }
.display-sm { font-size: clamp(28px, 3.4vw, 48px); }
```

- [ ] **Step 4: Create `src/styles/tailwind.css`**

```css
@import "tailwindcss";
@import "./reset.css";
@import "./tokens.css";
@import "./typography.css";

@theme {
  --color-surface-deep: #0a1410;
  --color-surface-relief: #0d1f16;
  --color-surface-break: #f2ede3;
  --color-text-primary: #f2ede3;
  --color-text-secondary: #a8c4b2;
  --color-text-mono: #7eb08c;
  --color-accent-bright: #aee4be;
  --color-accent-primary: #7eb08c;
  --color-accent-deep: #3d6b52;
  --color-accent-water: #6fb8c2;
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Inter Tight', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

- [ ] **Step 5: Download font files**

Create `public/fonts/` and add placeholder instructions. Real fonts added in browser verification step.

```bash
mkdir -p public/fonts
```

Run (each separately):
```bash
curl -L "https://github.com/undercasetype/Fraunces/raw/refs/heads/master/fonts/variable/Fraunces%5BSOFT%2CWONK%2Copsz%2CSOFT%2Cwght%5D.ttf" -o /tmp/fraunces.ttf
curl -L "https://github.com/rsms/inter/raw/master/docs/font-files/InterVariable.woff2" -o public/fonts/inter-tight-variable.woff2
curl -L "https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/variable/JetBrainsMono%5Bwght%5D.ttf" -o /tmp/jetbrains.ttf
```

Convert TTFs to WOFF2 if `woff2_compress` is installed, else fallback:
```bash
if command -v woff2_compress >/dev/null 2>&1; then
  woff2_compress /tmp/fraunces.ttf && mv /tmp/fraunces.woff2 public/fonts/fraunces-variable.woff2
  woff2_compress /tmp/jetbrains.ttf && mv /tmp/jetbrains.woff2 public/fonts/jetbrains-mono-variable.woff2
else
  cp /tmp/fraunces.ttf public/fonts/fraunces-variable.woff2
  cp /tmp/jetbrains.ttf public/fonts/jetbrains-mono-variable.woff2
fi
```

Note in README: fonts are served uncompressed if woff2_compress is absent; production build should subset + compress.

- [ ] **Step 6: Update `src/pages/index.astro` to import styles**

```astro
---
import '~/styles/tailwind.css';
---
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Elysee</title>
  </head>
  <body>
    <h1 class="display-lg">The flow <span class="serif-italic">of growth.</span></h1>
    <p class="mono">Elysee · since 1979 · 65 countries</p>
  </body>
</html>
```

- [ ] **Step 7: Verify visually**

Run: `npm run dev`
Open http://localhost:4321. Expected: dark forest background, large serif headline with italic "of growth" in bright green, mono subline below. No console errors.

- [ ] **Step 8: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: design tokens, typography, reset, tailwind v4 theme"
```

---

## Task 3: Base layout, Meta, Nav, Footer primitives

**Files:**
- Create: `src/layouts/Base.astro`
- Create: `src/components/ui/Meta.astro`
- Create: `src/components/ui/Nav.astro`
- Create: `src/components/ui/Marquee.astro`
- Create: `src/components/ui/Button.astro`
- Create: `src/components/ui/SpecTag.astro`
- Create: `src/data/nav.ts`

- [ ] **Step 1: Create `src/data/nav.ts`**

```ts
export const navLinks = [
  { label: 'Products', href: '/products' },
  { label: 'About', href: '/#manifesto' },
  { label: 'Insights', href: '/#insights' },
  { label: 'Contact', href: '/#contact' }
];

export const siteName = 'Elysee Irrigation';
export const siteDescription = 'Streaming water. Streaming life. Leading-edge piping & fitting systems engineered in Cyprus since 1979.';
```

- [ ] **Step 2: Create `src/components/ui/Meta.astro`**

```astro
---
interface Props {
  title: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
}
const { title, description = 'Streaming water. Streaming life.', ogImage = '/og/default.jpg', canonical } = Astro.props;
const canonicalURL = canonical ?? new URL(Astro.url.pathname, Astro.site).href;
---
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonicalURL} />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />

<link rel="preload" href="/fonts/fraunces-variable.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/fonts/inter-tight-variable.woff2" as="font" type="font/woff2" crossorigin />

<meta property="og:type" content="website" />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={new URL(ogImage, Astro.site).href} />
<meta property="og:url" content={canonicalURL} />
<meta name="twitter:card" content="summary_large_image" />
```

- [ ] **Step 3: Create `src/components/ui/SpecTag.astro`**

```astro
---
interface Props { tone?: 'neutral' | 'bright' | 'subtle'; class?: string }
const { tone = 'neutral', class: className = '' } = Astro.props;
const tones = {
  neutral: 'text-text-mono',
  bright: 'text-accent-bright',
  subtle: 'text-text-secondary opacity-70'
};
---
<span class:list={['mono', tones[tone], className]}><slot /></span>
```

- [ ] **Step 4: Create `src/components/ui/Button.astro`**

```astro
---
interface Props {
  variant?: 'primary' | 'arrow';
  href?: string;
  class?: string;
}
const { variant = 'primary', href, class: className = '' } = Astro.props;
const Tag = href ? 'a' : 'button';
---
{variant === 'primary' && (
  <Tag
    href={href}
    class:list={['group relative inline-flex items-center overflow-hidden rounded-full border border-accent-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-accent-bright transition-colors hover:text-surface-deep', className]}
  >
    <span class="absolute inset-0 origin-bottom scale-y-0 bg-accent-bright transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100" />
    <span class="relative"><slot /></span>
  </Tag>
)}
{variant === 'arrow' && (
  <Tag href={href} class:list={['group inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-text-primary', className]}>
    <span><slot /></span>
    <span class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-hairline transition-transform duration-500 group-hover:rotate-45 group-hover:border-accent-bright">→</span>
  </Tag>
)}
```

- [ ] **Step 5: Create `src/components/ui/Marquee.astro`**

```astro
---
interface Props { speed?: number; class?: string }
const { speed = 40, class: className = '' } = Astro.props;
---
<div class:list={['overflow-hidden whitespace-nowrap', className]} data-marquee data-speed={speed}>
  <div class="inline-block will-change-transform" data-marquee-track>
    <slot />
    <slot />
  </div>
</div>
```

- [ ] **Step 6: Create `src/components/ui/Nav.astro`**

```astro
---
import { navLinks } from '~/data/nav';
import Button from './Button.astro';
---
<nav data-nav class="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-6 md:px-12">
  <a href="/" class="font-display text-xl">Elysee</a>
  <ul class="hidden md:flex items-center gap-8 font-mono text-[11px] uppercase tracking-[0.18em] text-text-secondary">
    {navLinks.map(link => (
      <li><a href={link.href} class="transition-colors hover:text-accent-bright">{link.label}</a></li>
    ))}
  </ul>
  <Button href="/#contact" class="hidden md:inline-flex">Get in touch</Button>
  <button data-nav-toggle class="md:hidden text-accent-bright" aria-label="Open menu">☰</button>
</nav>

<script>
  const nav = document.querySelector('[data-nav]') as HTMLElement | null;
  if (nav) {
    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > last && y > 80) nav.style.transform = 'translateY(-100%)';
      else nav.style.transform = 'translateY(0)';
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }
</script>

<style>
  nav { transition: transform 0.35s cubic-bezier(0.65, 0, 0.35, 1); }
</style>
```

- [ ] **Step 7: Create `src/layouts/Base.astro`**

```astro
---
import '~/styles/tailwind.css';
import Meta from '~/components/ui/Meta.astro';
import Nav from '~/components/ui/Nav.astro';

interface Props {
  title: string;
  description?: string;
  ogImage?: string;
}
const { title, description, ogImage } = Astro.props;
---
<html lang="en">
  <head>
    <Meta title={title} description={description} ogImage={ogImage} />
  </head>
  <body class="bg-surface-deep text-text-primary min-h-screen">
    <Nav />
    <main><slot /></main>
  </body>
</html>
```

- [ ] **Step 8: Update `src/pages/index.astro` to use Base layout**

```astro
---
import Base from '~/layouts/Base.astro';
---
<Base title="Elysee Irrigation — Streaming water, streaming life">
  <section class="min-h-screen flex items-center justify-center">
    <h1 class="display-xl">The flow <span class="serif-italic">of growth.</span></h1>
  </section>
</Base>
```

- [ ] **Step 9: Browser verify**

Run `npm run dev`. Open http://localhost:4321.
Expected: nav bar at top with "Elysee" logo, nav links visible on desktop (hidden on narrow), "Get in touch" button. Scroll down — nav hides. Scroll up — nav reveals. No console errors.

- [ ] **Step 10: Build verify**

Run: `npm run build && npm run check`
Expected: Both pass, no TS errors.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: base layout, meta, nav with scroll-hide, spec tag, button, marquee primitives"
```

---

## Task 4: Reduced-motion utility + Vitest setup

**Files:**
- Create: `vitest.config.ts`
- Create: `src/scripts/utils/reducedMotion.ts`
- Create: `src/scripts/utils/prefersPointer.ts`
- Create: `tests/reducedMotion.test.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts']
  },
  resolve: {
    alias: { '~': new URL('./src', import.meta.url).pathname }
  }
});
```

- [ ] **Step 2: Install jsdom**

Run: `npm install -D jsdom`

- [ ] **Step 3: Write the failing test — `tests/reducedMotion.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prefersReducedMotion, onReducedMotionChange } from '~/scripts/utils/reducedMotion';

describe('prefersReducedMotion', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('reduce'),
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));
  });

  it('returns true when media query matches reduce', () => {
    expect(prefersReducedMotion()).toBe(true);
  });

  it('returns false when media query does not match', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    expect(prefersReducedMotion()).toBe(false);
  });

  it('onReducedMotionChange calls callback with current state on registration', () => {
    const cb = vi.fn();
    onReducedMotionChange(cb);
    expect(cb).toHaveBeenCalledWith(true);
  });
});
```

- [ ] **Step 4: Run — expect failure**

Run: `npm run test`
Expected: FAIL — module not found.

- [ ] **Step 5: Implement `src/scripts/utils/reducedMotion.ts`**

```ts
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function onReducedMotionChange(cb: (reduced: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  cb(mq.matches);
  const handler = (e: MediaQueryListEvent) => cb(e.matches);
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}
```

- [ ] **Step 6: Run test — expect pass**

Run: `npm run test`
Expected: 3 passing.

- [ ] **Step 7: Implement `src/scripts/utils/prefersPointer.ts`**

```ts
export function hasFinePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: fine)').matches;
}
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: reducedMotion + prefersPointer utilities with vitest"
```

---

## Task 5: Counter tween utility (pure logic, TDD)

**Files:**
- Create: `src/scripts/utils/counter.ts`
- Create: `tests/counter.test.ts`

- [ ] **Step 1: Write failing tests — `tests/counter.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { easeOutExpo, formatNumber, interpolate } from '~/scripts/utils/counter';

describe('easeOutExpo', () => {
  it('returns 0 at t=0', () => { expect(easeOutExpo(0)).toBe(0); });
  it('returns 1 at t=1', () => { expect(easeOutExpo(1)).toBe(1); });
  it('is monotonically increasing in (0,1)', () => {
    let last = 0;
    for (let t = 0.1; t < 1; t += 0.1) {
      const v = easeOutExpo(t);
      expect(v).toBeGreaterThan(last);
      last = v;
    }
  });
});

describe('interpolate', () => {
  it('at t=0 returns from', () => { expect(interpolate(0, 10, 0)).toBe(0); });
  it('at t=1 returns to', () => { expect(interpolate(0, 10, 1)).toBe(10); });
  it('handles negative ranges', () => { expect(interpolate(10, 0, 0.5)).toBeLessThan(10); });
});

describe('formatNumber', () => {
  it('formats integers with comma separators', () => { expect(formatNumber(5000)).toBe('5,000'); });
  it('strips trailing zeros for floats', () => { expect(formatNumber(46)).toBe('46'); });
  it('appends suffix when provided', () => { expect(formatNumber(5000, { suffix: '+' })).toBe('5,000+'); });
});
```

- [ ] **Step 2: Run — expect failure**

Run: `npm run test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/scripts/utils/counter.ts`**

```ts
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
```

- [ ] **Step 4: Run — expect pass**

Run: `npm run test`
Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: counter utility (ease, interpolate, format, tween) with tests"
```

---

## Task 6: GSAP registration + Lenis integration

**Files:**
- Create: `src/scripts/motion/registerGSAP.ts`
- Create: `src/scripts/motion/lenis.ts`

- [ ] **Step 1: Create `src/scripts/motion/registerGSAP.ts`**

```ts
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
```

Note on Club plugins (SplitText, DrawSVG): for now, we stub these with native equivalents so the codebase boots without a Club license. A later task wires them in if the license is present.

- [ ] **Step 2: Create `src/scripts/motion/lenis.ts`**

```ts
import Lenis from 'lenis';
import { gsap, ScrollTrigger, registerGSAP } from './registerGSAP';
import { prefersReducedMotion } from '~/scripts/utils/reducedMotion';

let lenis: Lenis | null = null;

export function initLenis(): Lenis | null {
  if (typeof window === 'undefined') return null;
  if (prefersReducedMotion()) return null;
  if (lenis) return lenis;

  registerGSAP();

  lenis = new Lenis({ duration: 1.1, easing: (t: number) => 1 - Math.pow(2, -10 * t), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

export function getLenis(): Lenis | null { return lenis; }
```

- [ ] **Step 3: Wire into `src/layouts/Base.astro`**

Replace the `<body>` contents to include a script tag at the bottom:

```astro
<body class="bg-surface-deep text-text-primary min-h-screen">
  <Nav />
  <main><slot /></main>
  <script>
    import { initLenis } from '~/scripts/motion/lenis';
    initLenis();
  </script>
</body>
```

- [ ] **Step 4: Browser verify**

Run: `npm run dev`
Expected: page loads; scrolling feels smoothed (with `prefers-reduced-motion: no-preference`). No console errors. If reduced motion is enabled in OS settings, page loads without Lenis (native scroll).

- [ ] **Step 5: Build verify**

Run: `npm run build && npm run check`
Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: gsap plugin registration and lenis smooth-scroll integration"
```

---

## Task 7: Particle flow WebGL canvas (OGL)

**Files:**
- Create: `src/assets/shaders/flow.vert`
- Create: `src/assets/shaders/flow.frag`
- Create: `src/scripts/motion/particleFlow.ts`
- Create: `src/components/hero/ParticleFlow.astro`
- Create: `tests/particleFlow.test.ts`

- [ ] **Step 1: Write failing test — `tests/particleFlow.test.ts`**

```ts
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
```

- [ ] **Step 2: Run — expect failure**

Run: `npm run test`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/assets/shaders/flow.vert`**

```glsl
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
```

- [ ] **Step 4: Create `src/assets/shaders/flow.frag`**

```glsl
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uFlowStrength;
uniform float uDensity;
uniform float uSpeed;

// Simplex-like noise (cheap approximation)
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

vec2 curl(vec2 p) {
  float e = 0.01;
  float n1 = noise(p + vec2(0.0, e));
  float n2 = noise(p - vec2(0.0, e));
  float n3 = noise(p + vec2(e, 0.0));
  float n4 = noise(p - vec2(e, 0.0));
  return vec2(n1 - n2, n4 - n3);
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = uv * aspect * uDensity;
  p += uTime * uSpeed * 0.05;
  vec2 flow = curl(p) * uFlowStrength;

  // Mouse curl
  vec2 mouseDist = uv - uMouse;
  float mouseInf = exp(-dot(mouseDist, mouseDist) * 20.0) * 0.3;
  flow += mouseInf * vec2(-mouseDist.y, mouseDist.x);

  float particle = noise(p + flow * 5.0);
  particle = smoothstep(0.45, 0.55, particle);

  vec3 col = mix(uColor1, uColor2, particle);
  col *= 0.12 + particle * 0.4; // Subtle overall
  gl_FragColor = vec4(col, 1.0);
}
```

- [ ] **Step 5: Implement `src/scripts/motion/particleFlow.ts`**

```ts
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import vertex from '~/assets/shaders/flow.vert?raw';
import fragment from '~/assets/shaders/flow.frag?raw';
import { prefersReducedMotion } from '~/scripts/utils/reducedMotion';

export interface FlowPreset {
  color1: [number, number, number];
  color2: [number, number, number];
  flowStrength: number;
  density: number;
  speed: number;
}

export const PRESETS: Record<string, FlowPreset> = {
  hero:      { color1: [0.04, 0.08, 0.06], color2: [0.50, 0.70, 0.55], flowStrength: 0.25, density: 3.0, speed: 1.0 },
  agri:      { color1: [0.05, 0.12, 0.07], color2: [0.68, 0.89, 0.74], flowStrength: 0.30, density: 4.0, speed: 0.8 },
  landscape: { color1: [0.04, 0.10, 0.08], color2: [0.43, 0.72, 0.76], flowStrength: 0.18, density: 2.5, speed: 0.6 },
  building:  { color1: [0.04, 0.06, 0.04], color2: [0.35, 0.45, 0.40], flowStrength: 0.10, density: 5.0, speed: 1.3 },
  industry:  { color1: [0.05, 0.10, 0.07], color2: [0.49, 0.69, 0.55], flowStrength: 0.08, density: 6.5, speed: 1.6 },
  counters:  { color1: [0.04, 0.09, 0.06], color2: [0.68, 0.89, 0.74], flowStrength: 0.22, density: 3.5, speed: 0.9 },
  map:       { color1: [0.03, 0.07, 0.06], color2: [0.43, 0.72, 0.76], flowStrength: 0.15, density: 2.0, speed: 0.5 },
  epsilon:   { color1: [0.04, 0.08, 0.06], color2: [0.68, 0.89, 0.74], flowStrength: 0.12, density: 4.5, speed: 1.1 }
};

export function lerpPreset(a: FlowPreset, b: FlowPreset, t: number): FlowPreset {
  const lerp = (x: number, y: number) => x + (y - x) * t;
  const lerp3 = (x: [number, number, number], y: [number, number, number]): [number, number, number] =>
    [lerp(x[0], y[0]), lerp(x[1], y[1]), lerp(x[2], y[2])];
  return {
    color1: lerp3(a.color1, b.color1),
    color2: lerp3(a.color2, b.color2),
    flowStrength: lerp(a.flowStrength, b.flowStrength),
    density: lerp(a.density, b.density),
    speed: lerp(a.speed, b.speed)
  };
}

export interface ParticleFlow {
  setPreset: (name: keyof typeof PRESETS, durationMs?: number) => void;
  destroy: () => void;
}

export function createParticleFlow(container: HTMLElement): ParticleFlow | null {
  if (prefersReducedMotion()) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const renderer = new Renderer({ dpr, alpha: false });
  const gl = renderer.gl;
  gl.clearColor(0.04, 0.08, 0.06, 1);
  container.appendChild(gl.canvas);
  Object.assign(gl.canvas.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '0', pointerEvents: 'none'
  });

  const geometry = new Triangle(gl);
  const current = { ...PRESETS.hero };
  const target = { ...PRESETS.hero };

  const program = new Program(gl, {
    vertex, fragment,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: [gl.canvas.width, gl.canvas.height] },
      uMouse: { value: [0.5, 0.5] },
      uColor1: { value: [...current.color1] },
      uColor2: { value: [...current.color2] },
      uFlowStrength: { value: current.flowStrength },
      uDensity: { value: current.density },
      uSpeed: { value: current.speed }
    }
  });
  const mesh = new Mesh(gl, { geometry, program });

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
  };
  onResize();
  window.addEventListener('resize', onResize, { passive: true });

  const onMouse = (e: MouseEvent) => {
    program.uniforms.uMouse.value = [e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight];
  };
  window.addEventListener('mousemove', onMouse, { passive: true });

  let rafId = 0;
  let lastFrame = performance.now();
  let slowFrames = 0;
  let transitionStart = 0;
  let transitioning = false;
  let transitionDuration = 0;
  let from: FlowPreset = { ...current };
  let to: FlowPreset = { ...current };

  const tick = (t: number) => {
    const dt = t - lastFrame;
    if (dt > 33) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
    lastFrame = t;
    if (slowFrames > 180) { destroy(); return; } // ~3s of sub-30fps

    program.uniforms.uTime.value = t * 0.001;

    if (transitioning) {
      const k = Math.min(1, (t - transitionStart) / transitionDuration);
      const eased = 1 - Math.pow(2, -10 * k);
      const lerped = lerpPreset(from, to, eased);
      program.uniforms.uColor1.value = [...lerped.color1];
      program.uniforms.uColor2.value = [...lerped.color2];
      program.uniforms.uFlowStrength.value = lerped.flowStrength;
      program.uniforms.uDensity.value = lerped.density;
      program.uniforms.uSpeed.value = lerped.speed;
      if (k >= 1) transitioning = false;
    }

    renderer.render({ scene: mesh });
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);

  function setPreset(name: keyof typeof PRESETS, durationMs = 900) {
    const preset = PRESETS[name];
    if (!preset) return;
    from = {
      color1: [...program.uniforms.uColor1.value] as [number, number, number],
      color2: [...program.uniforms.uColor2.value] as [number, number, number],
      flowStrength: program.uniforms.uFlowStrength.value,
      density: program.uniforms.uDensity.value,
      speed: program.uniforms.uSpeed.value
    };
    to = preset;
    transitionStart = performance.now();
    transitionDuration = durationMs;
    transitioning = true;
  }

  function destroy() {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('mousemove', onMouse);
    gl.canvas.remove();
  }

  return { setPreset, destroy };
}
```

- [ ] **Step 6: Run tests — expect pass**

Run: `npm run test`
Expected: all passing.

- [ ] **Step 7: Create `src/components/hero/ParticleFlow.astro`**

```astro
---
// Renders a container div + hydrates the canvas client-side (idle).
---
<div id="particle-flow-root" aria-hidden="true"></div>

<script>
  import { createParticleFlow } from '~/scripts/motion/particleFlow';

  const start = () => {
    const host = document.getElementById('particle-flow-root');
    if (!host) return;
    const flow = createParticleFlow(host);
    if (flow) {
      (window as any).__flow = flow;
    }
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(start, { timeout: 2000 });
  } else {
    setTimeout(start, 800);
  }
</script>
```

- [ ] **Step 8: Mount in `src/pages/index.astro`**

```astro
---
import Base from '~/layouts/Base.astro';
import ParticleFlow from '~/components/hero/ParticleFlow.astro';
---
<Base title="Elysee Irrigation — Streaming water, streaming life">
  <ParticleFlow />
  <section class="relative z-10 min-h-screen flex items-center justify-center">
    <h1 class="display-xl">The flow <span class="serif-italic">of growth.</span></h1>
  </section>
</Base>
```

- [ ] **Step 9: Browser verify**

Run: `npm run dev`
Open http://localhost:4321. After ~1s idle, animated particle field should appear behind the headline. Move mouse — field should curl slightly toward cursor. No console errors. Check DevTools: canvas element is fixed, pointer-events none.

- [ ] **Step 10: Reduced-motion verify**

DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce` → reload. Expected: no canvas appears.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: OGL particle flow canvas with preset system and reduced-motion support"
```

---

## Task 8: Content collections (products, sectors, insights)

**Files:**
- Create: `src/content/config.ts`
- Create: `src/content/sectors/agriculture.mdx`, `landscape.mdx`, `building.mdx`, `industry.mdx`
- Create: `src/content/products/*.mdx` (8 products including epsilon)
- Create: `src/content/insights/*.mdx` (4 entries)

- [ ] **Step 1: Create `src/content/config.ts`**

```ts
import { defineCollection, z } from 'astro:content';

const products = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    category: z.enum(['compression-fittings', 'pvc-ball-valves', 'saddles', 'adaptor-flanged', 'couplings', 'valves']),
    blurb: z.string(),
    pressure: z.string(),
    sizeRange: z.string(),
    featured: z.boolean().default(false),
    image: z.string(),
    specs: z.array(z.object({ key: z.string(), value: z.string() })).default([]),
    bim: z.boolean().default(false),
    datasheet: z.string().optional()
  })
});

const sectors = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    tagline: z.string(),
    image: z.string(),
    bullets: z.array(z.string()),
    accent: z.string()
  })
});

const insights = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    excerpt: z.string(),
    cover: z.string(),
    tag: z.enum(['news', 'blog', 'exhibition'])
  })
});

export const collections = { products, sectors, insights };
```

- [ ] **Step 2: Create sector MDX files**

`src/content/sectors/agriculture.mdx`:

```mdx
---
name: Agriculture
tagline: From seed to harvest, streaming life through fields.
image: /images/sectors/agriculture.jpg
bullets:
  - Drip irrigation systems
  - Sprinkler networks
  - Flow control
  - Fertigation
accent: '#aee4be'
---

Irrigating 2.3M hectares across 65 countries.
```

`src/content/sectors/landscape.mdx`:

```mdx
---
name: Landscape
tagline: Public parks, private gardens, living canopies.
image: /images/sectors/landscape.jpg
bullets:
  - Garden irrigation
  - Municipal networks
  - Smart controllers
  - Rainwater harvesting
accent: '#7eb08c'
---

Quiet infrastructure for the places we live.
```

`src/content/sectors/building.mdx`:

```mdx
---
name: Building
tagline: Plumbing that disappears into good architecture.
image: /images/sectors/building.jpg
bullets:
  - Cold & hot water
  - Underfloor heating
  - Gas distribution
  - BIM integration
accent: '#6fb8c2'
---

PE-Xa, PB, multilayer composite. Engineered for decades.
```

`src/content/sectors/industry.mdx`:

```mdx
---
name: Industry
tagline: High pressure, high temperature, high stakes.
image: /images/sectors/industry.jpg
bullets:
  - Chemical transport
  - Pressure mains
  - Mining & geothermal
  - Custom fabrication
accent: '#3d6b52'
---

When standards matter more than aesthetics.
```

- [ ] **Step 3: Create product MDX files (8)**

`src/content/products/epsilon.mdx`:

```mdx
---
name: Epsilon Series
category: compression-fittings
blurb: Compression fittings for PE pipes. Ø20–Ø110. PN16.
pressure: 16 bar
sizeRange: Ø20–Ø110
featured: true
image: /images/products/epsilon-hero.jpg
specs:
  - { key: 'Material', value: 'POM body / EPDM seal' }
  - { key: 'Standard', value: 'ISO 17885' }
  - { key: 'Temperature', value: '-10°C to 60°C' }
  - { key: 'Pressure', value: 'PN16' }
  - { key: 'Certification', value: 'WRAS, KIWA' }
bim: true
datasheet: /downloads/epsilon-datasheet.pdf
---

A quick-fit, re-usable compression system with a market-proven five-part architecture: body, o-ring, collet, insert, and nut.
```

Create 7 more products (each a minimal MDX following the same schema). Names & minimal distinguishing fields:

`src/content/products/pvc-ball-valve.mdx` — name: "PVC Ball Valve", category: pvc-ball-valves, sizeRange: Ø20–Ø110, pressure: PN16
`src/content/products/saddle-clamp.mdx` — name: "Saddle Clamp", category: saddles, sizeRange: Ø63–Ø315, pressure: PN16
`src/content/products/adaptor-flanged.mdx` — name: "Adaptor Flanged Set", category: adaptor-flanged, sizeRange: Ø50–Ø160, pressure: PN16
`src/content/products/coupling-repair.mdx` — name: "Coupling Repair", category: couplings, sizeRange: Ø20–Ø110, pressure: PN16
`src/content/products/coupling-transition.mdx` — name: "Coupling Global Transition", category: couplings, sizeRange: Ø20–Ø63, pressure: PN16
`src/content/products/double-union-glued.mdx` — name: "Double Union Glued", category: valves, sizeRange: Ø20–Ø63, pressure: PN16
`src/content/products/single-4-bolts.mdx` — name: "Single 4-bolts Flange", category: adaptor-flanged, sizeRange: Ø110–Ø315, pressure: PN10

Each file uses the Epsilon template with adjusted values. Bodies can be single sentence: "[Short description.]"

- [ ] **Step 4: Create 4 insight MDX files**

`src/content/insights/epsilon-launch.mdx`:

```mdx
---
title: Introducing Epsilon Series
date: 2026-03-10
excerpt: A new chapter in compression fittings — five parts, zero compromise.
cover: /images/insights/epsilon-launch.jpg
tag: news
---

Elysee unveils the next-gen compression fitting line.
```

`src/content/insights/water-tech-expo.mdx` — title: "Water Tech Expo 2026", date: 2026-02-20, tag: exhibition
`src/content/insights/sustainability-report.mdx` — title: "Sustainability Report 2025", date: 2026-01-30, tag: news
`src/content/insights/beyond-the-field.mdx` — title: "Beyond the field: why PE pipes outlive us all", date: 2026-01-10, tag: blog

- [ ] **Step 5: Create `src/data/stats.ts`**

```ts
export const companyStats = {
  yearsActive: 46,
  productCodes: 5000,
  countries: 65
};
```

- [ ] **Step 6: Create `src/data/globalMap.ts`**

```ts
export const hq = { lat: 35.14, lng: 33.38, label: 'CY · HQ' }; // Cyprus

export const markets: Array<{ lat: number; lng: number; label: string; primary?: boolean }> = [
  { lat: 30.05, lng: 31.24, label: 'EG · PRIME', primary: true },
  { lat: 51.16, lng: 10.45, label: 'DE · ROHRSYSTEME', primary: true },
  { lat: 40.42, lng: -3.70, label: 'ES' },
  { lat: 31.05, lng: -7.58, label: 'MA' },
  { lat: 45.75, lng: 15.98, label: 'HR' },
  { lat: -1.29, lng: 36.82, label: 'KE' },
  { lat: 23.88, lng: 45.08, label: 'SA' }
];
```

- [ ] **Step 7: Write test — `tests/stats.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { companyStats } from '~/data/stats';

describe('companyStats', () => {
  it('has the three expected fields', () => {
    expect(companyStats).toMatchObject({
      yearsActive: expect.any(Number),
      productCodes: expect.any(Number),
      countries: expect.any(Number)
    });
  });
  it('values are positive', () => {
    expect(companyStats.yearsActive).toBeGreaterThan(0);
    expect(companyStats.productCodes).toBeGreaterThan(0);
    expect(companyStats.countries).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 8: Add placeholder images**

```bash
mkdir -p public/images/sectors public/images/products public/images/insights public/downloads
```

For each image referenced, drop a 1200×800 placeholder JPG (solid color + label text) via ImageMagick:

```bash
if command -v magick >/dev/null 2>&1; then
  for name in agriculture landscape building industry; do
    magick -size 1200x800 canvas:'#0d1f16' -fill '#aee4be' -font Helvetica -pointsize 72 -gravity center -annotate 0 "$name" public/images/sectors/$name.jpg
  done
  magick -size 1600x1200 canvas:'#0a1410' -fill '#aee4be' -gravity center -pointsize 64 -annotate 0 "epsilon" public/images/products/epsilon-hero.jpg
  for p in pvc-ball-valve saddle-clamp adaptor-flanged coupling-repair coupling-transition double-union-glued single-4-bolts; do
    magick -size 1200x900 canvas:'#0d1f16' -fill '#aee4be' -gravity center -pointsize 48 -annotate 0 "$p" public/images/products/$p.jpg
  done
  for i in epsilon-launch water-tech-expo sustainability-report beyond-the-field; do
    magick -size 1200x800 canvas:'#0d1f16' -fill '#aee4be' -gravity center -pointsize 48 -annotate 0 "$i" public/images/insights/$i.jpg
  done
else
  echo "ImageMagick not installed — placeholder images skipped. Add manually before launch."
fi
```

- [ ] **Step 9: Run tests + build**

Run: `npm run test && npm run build`
Expected: tests pass, build succeeds, MDX schemas validated.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: content collections for products, sectors, insights + stats data"
```

---

## Task 9: Homepage Act 01 · Hero

**Files:**
- Create: `src/components/hero/SplitHeadline.astro`
- Create: `src/components/sections/Hero.astro`
- Create: `src/scripts/motion/timelines/hero.ts`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create `src/components/hero/SplitHeadline.astro`**

```astro
---
interface Props { text: string; emphasisWords?: string[]; class?: string }
const { text, emphasisWords = [], class: className = '' } = Astro.props;
const words = text.split(/\s+/);
---
<h1 class:list={['display-xl inline-block', className]} data-split-headline>
  {words.map((w, i) => {
    const emphasis = emphasisWords.some(e => e.toLowerCase() === w.toLowerCase().replace(/[.,]/g, ''));
    return (
      <span class="inline-block overflow-hidden align-bottom" data-word-wrap>
        <span
          class:list={['inline-block will-change-transform translate-y-full', emphasis && 'serif-italic']}
          data-word
          data-emphasis={emphasis}
        >
          {w}{i < words.length - 1 ? '\u00A0' : ''}
        </span>
      </span>
    );
  })}
</h1>
```

- [ ] **Step 2: Create `src/components/sections/Hero.astro`**

```astro
---
import SplitHeadline from '~/components/hero/SplitHeadline.astro';
---
<section data-section="hero" class="relative z-10 min-h-screen flex flex-col justify-center px-[var(--margin)] pb-24">
  <p class="mono mb-8">Elysee · since 1979 · 65 countries</p>
  <SplitHeadline text="The flow of growth." emphasisWords={['of', 'flow']} />
  <div class="absolute bottom-10 right-[var(--margin)] flex items-center gap-4 text-text-secondary mono">
    <span>scroll</span>
    <span class="block h-14 w-px origin-top bg-text-mono" data-hero-scrollhint></span>
  </div>
</section>
```

- [ ] **Step 3: Create `src/scripts/motion/timelines/hero.ts`**

```ts
import { gsap, registerGSAP } from '../registerGSAP';

export function playHero() {
  registerGSAP();
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to('[data-section="hero"] .mono', { opacity: 1, y: 0, duration: 0.6 }, 0)
    .to('[data-section="hero"] [data-word]', { y: 0, duration: 1.0, stagger: 0.08 }, 0.15)
    .from('[data-hero-scrollhint]', { scaleY: 0, duration: 0.8, ease: 'power2.inOut' }, '-=0.4');
  return tl;
}
```

Also extend `src/components/sections/Hero.astro` to set initial state:

Modify mono `<p>` class to add `opacity-0 translate-y-3`. Then the timeline tweens them in.

Replace the `<p>` line with:
```astro
<p class="mono mb-8 opacity-0 translate-y-3">Elysee · since 1979 · 65 countries</p>
```

- [ ] **Step 4: Update `src/pages/index.astro`**

```astro
---
import Base from '~/layouts/Base.astro';
import ParticleFlow from '~/components/hero/ParticleFlow.astro';
import Hero from '~/components/sections/Hero.astro';
---
<Base title="Elysee Irrigation — Streaming water, streaming life">
  <ParticleFlow />
  <Hero />

  <script>
    import { playHero } from '~/scripts/motion/timelines/hero';
    import { prefersReducedMotion } from '~/scripts/utils/reducedMotion';
    if (!prefersReducedMotion()) {
      window.addEventListener('DOMContentLoaded', () => playHero());
    } else {
      // Instant reveal for reduced motion
      document.querySelectorAll('[data-section="hero"] [data-word]').forEach(el => (el as HTMLElement).style.transform = 'translateY(0)');
      document.querySelectorAll('[data-section="hero"] .mono').forEach(el => { (el as HTMLElement).style.opacity = '1'; (el as HTMLElement).style.transform = 'none'; });
    }
  </script>
</Base>
```

- [ ] **Step 5: Browser verify**

Run: `npm run dev`
Open http://localhost:4321. Expected: particle field behind, mono line fades in, headline words rise from below one after another (stagger). Scroll-hint vertical line draws down. No console errors.

- [ ] **Step 6: Reduced-motion verify**

Emulate `prefers-reduced-motion: reduce` → reload. Headline and mono visible instantly, no animation.

- [ ] **Step 7: Build verify**

Run: `npm run build && npm run check`
Expected: pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: homepage hero — split headline reveal, scroll hint, mono subline"
```

---

## Task 10: Homepage Act 02 · Manifesto (pinned, scrubbed, light inversion)

**Files:**
- Create: `src/components/sections/Manifesto.astro`
- Create: `src/scripts/motion/timelines/manifesto.ts`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create `src/components/sections/Manifesto.astro`**

```astro
---
const text = `Since 1979, we've built systems that carry water — and everything water carries. Through fields and cities, factories and gardens, across 65 countries. A quieter kind of infrastructure, built to last.`;
const words = text.split(/\s+/);
---
<section data-section="manifesto" id="manifesto" class="relative z-10 bg-surface-deep text-text-primary" data-manifesto-wrap>
  <div class="h-screen flex items-center px-[var(--margin)]" data-manifesto-inner>
    <div class="max-w-[80ch]">
      <p class="mono mb-8 text-text-mono">— Our quieter infrastructure</p>
      <p class="display-md leading-[1.05] font-display font-medium tracking-[-0.02em]" data-manifesto-text>
        {words.map(w => <span data-mword class="opacity-20 transition-colors">{w} </span>)}
      </p>
    </div>
    <svg class="pointer-events-none absolute inset-0 w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none" aria-hidden="true">
      <path data-manifesto-wave d="M0 600 C 300 520, 600 680, 900 580 S 1200 640, 1200 640" stroke="currentColor" stroke-width="1.5" fill="none" class="text-accent-deep" stroke-dasharray="2500" stroke-dashoffset="2500" />
    </svg>
  </div>
</section>
```

- [ ] **Step 2: Create `src/scripts/motion/timelines/manifesto.ts`**

```ts
import { gsap, ScrollTrigger, registerGSAP } from '../registerGSAP';

export function initManifesto() {
  registerGSAP();
  const wrap = document.querySelector('[data-manifesto-wrap]') as HTMLElement;
  if (!wrap) return;

  ScrollTrigger.create({
    trigger: wrap,
    start: 'top top',
    end: '+=150%',
    pin: true,
    scrub: 0.8,
    onEnter:       () => gsap.to(wrap,  { backgroundColor: '#f2ede3', color: '#0a1410', duration: 0.6 }),
    onLeave:       () => gsap.to(wrap,  { backgroundColor: '#0a1410', color: '#f2ede3', duration: 0.6 }),
    onEnterBack:   () => gsap.to(wrap,  { backgroundColor: '#f2ede3', color: '#0a1410', duration: 0.6 }),
    onLeaveBack:   () => gsap.to(wrap,  { backgroundColor: '#0a1410', color: '#f2ede3', duration: 0.6 }),
    animation: gsap.timeline()
      .to('[data-mword]', { opacity: 1, stagger: { amount: 1 } }, 0)
      .to('[data-manifesto-wave]', { strokeDashoffset: 0, duration: 1, ease: 'none' }, 0)
  });

  // Hook to particleFlow (if available): shift preset on enter/leave
  ScrollTrigger.create({
    trigger: wrap,
    start: 'top 60%',
    end: 'bottom 40%',
    onEnter: () => (window as any).__flow?.setPreset('counters', 1200),
    onLeaveBack: () => (window as any).__flow?.setPreset('hero', 800)
  });
}
```

- [ ] **Step 3: Update `src/pages/index.astro`**

Add import + component after Hero:

```astro
---
import Base from '~/layouts/Base.astro';
import ParticleFlow from '~/components/hero/ParticleFlow.astro';
import Hero from '~/components/sections/Hero.astro';
import Manifesto from '~/components/sections/Manifesto.astro';
---
<Base title="Elysee Irrigation — Streaming water, streaming life">
  <ParticleFlow />
  <Hero />
  <Manifesto />

  <script>
    import { playHero } from '~/scripts/motion/timelines/hero';
    import { initManifesto } from '~/scripts/motion/timelines/manifesto';
    import { prefersReducedMotion } from '~/scripts/utils/reducedMotion';

    window.addEventListener('DOMContentLoaded', () => {
      if (prefersReducedMotion()) {
        document.querySelectorAll('[data-word]').forEach(el => (el as HTMLElement).style.transform = 'translateY(0)');
        document.querySelectorAll('[data-mword]').forEach(el => (el as HTMLElement).style.opacity = '1');
        return;
      }
      playHero();
      initManifesto();
    });
  </script>
</Base>
```

- [ ] **Step 4: Browser verify**

`npm run dev`. Scroll slowly after the hero. Expected: manifesto section pins, background fades to alabaster, text is dark on light, words brighten as you scroll, SVG wave draws across. Exit section → returns to dark. Particle field visibly shifts color/density.

- [ ] **Step 5: Reduced-motion verify**

Emulate reduce → manifesto is instantly visible, no pin, no scrub.

- [ ] **Step 6: Build verify**

Run: `npm run build && npm run check` — pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: homepage manifesto — pinned scrub, light inversion, drawn waveform"
```

---

## Task 11: Homepage Act 03 · Four Worlds (horizontal pinned scroll)

**Files:**
- Create: `src/components/sections/FourWorlds.astro`
- Create: `src/scripts/motion/timelines/fourWorlds.ts`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create `src/components/sections/FourWorlds.astro`**

```astro
---
import { getCollection } from 'astro:content';
const sectors = await getCollection('sectors');
const order = ['agriculture', 'landscape', 'building', 'industry'];
const ordered = order.map(slug => sectors.find(s => s.slug === slug)!);
---
<section data-section="four-worlds" class="relative z-10" aria-label="Four sectors Elysee serves">
  <div data-worlds-pin class="relative h-screen overflow-hidden">
    <header class="pointer-events-none absolute top-0 left-0 right-0 px-[var(--margin)] pt-12 z-20">
      <p class="mono text-text-mono mb-4">III · Four worlds, one flow</p>
      <h2 class="display-lg font-display font-medium tracking-[-0.02em] max-w-[20ch]">Four worlds,<br /><span class="serif-italic">one flow.</span></h2>
    </header>

    <div data-worlds-track class="absolute inset-0 flex">
      {ordered.map((sector, i) => (
        <article
          data-world-panel
          data-preset={sector.slug}
          class="flex-shrink-0 w-screen h-screen relative px-[var(--margin)] flex items-end pb-24"
        >
          <div class="grid grid-cols-12 gap-6 w-full">
            <div class="col-span-7">
              <p class="mono text-accent-bright mb-3">0{i + 1} / 04</p>
              <h3 class="font-display leading-[0.88] tracking-[-0.025em]" style="font-size: clamp(80px, 15vw, 220px);">{sector.data.name}</h3>
              <p class="mono text-text-secondary mt-4 max-w-md">{sector.data.tagline}</p>
              <ul class="mt-6 flex flex-wrap gap-2">
                {sector.data.bullets.map(b => (
                  <li class="mono border border-hairline rounded-full px-3 py-2 text-text-mono">{b}</li>
                ))}
              </ul>
            </div>
            <div class="col-span-5 relative">
              <div class="aspect-[3/4] w-full overflow-hidden" style="clip-path: polygon(0 0, 100% 6%, 94% 100%, 0 94%);">
                <img src={sector.data.image} alt={sector.data.name} class="w-full h-full object-cover" loading="lazy" />
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>

    <div class="pointer-events-none absolute bottom-8 left-[var(--margin)] right-[var(--margin)] flex gap-2 z-20">
      {ordered.map(() => <span data-worlds-tick class="h-px flex-1 bg-hairline origin-left scale-x-100"></span>)}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Create `src/scripts/motion/timelines/fourWorlds.ts`**

```ts
import { gsap, ScrollTrigger, registerGSAP } from '../registerGSAP';

export function initFourWorlds() {
  registerGSAP();
  const pin = document.querySelector('[data-worlds-pin]') as HTMLElement | null;
  const track = document.querySelector('[data-worlds-track]') as HTMLElement | null;
  const panels = gsap.utils.toArray<HTMLElement>('[data-world-panel]');
  const ticks  = gsap.utils.toArray<HTMLElement>('[data-worlds-tick]');
  if (!pin || !track || panels.length === 0) return;

  const total = panels.length;

  ScrollTrigger.create({
    trigger: pin,
    start: 'top top',
    end: () => `+=${window.innerWidth * (total - 1)}`,
    pin: true,
    scrub: 0.5,
    anticipatePin: 1,
    animation: gsap.to(track, { x: () => -window.innerWidth * (total - 1), ease: 'none' }),
    onUpdate: (self) => {
      const progress = self.progress * (total - 1);
      const idx = Math.round(progress);
      const preset = panels[idx]?.dataset.preset as string | undefined;
      const last = (window as any).__lastWorldPreset;
      if (preset && preset !== last) {
        (window as any).__flow?.setPreset(preset, 800);
        (window as any).__lastWorldPreset = preset;
        ticks.forEach((t, i) => gsap.to(t, { scaleX: i === idx ? 2.4 : 1, backgroundColor: i === idx ? '#aee4be' : '#ffffff1f', duration: 0.4 }));
      }
    }
  });

  // Mobile fallback: stack vertically, no pin
  ScrollTrigger.matchMedia({
    '(max-width: 767px)': () => {
      ScrollTrigger.getAll().filter(st => st.trigger === pin).forEach(st => st.kill());
      if (track) { track.style.flexDirection = 'column'; track.style.position = 'static'; track.style.transform = 'none'; }
      if (pin) pin.style.height = 'auto';
      panels.forEach(p => { p.style.width = '100vw'; p.style.height = '100vh'; });
    }
  });
}
```

- [ ] **Step 3: Wire into `src/pages/index.astro`**

Add import of FourWorlds and call `initFourWorlds()` in DOMContentLoaded block (after manifesto).

```astro
---
import Base from '~/layouts/Base.astro';
import ParticleFlow from '~/components/hero/ParticleFlow.astro';
import Hero from '~/components/sections/Hero.astro';
import Manifesto from '~/components/sections/Manifesto.astro';
import FourWorlds from '~/components/sections/FourWorlds.astro';
---
<Base title="Elysee Irrigation — Streaming water, streaming life">
  <ParticleFlow />
  <Hero />
  <Manifesto />
  <FourWorlds />

  <script>
    import { playHero } from '~/scripts/motion/timelines/hero';
    import { initManifesto } from '~/scripts/motion/timelines/manifesto';
    import { initFourWorlds } from '~/scripts/motion/timelines/fourWorlds';
    import { prefersReducedMotion } from '~/scripts/utils/reducedMotion';

    window.addEventListener('DOMContentLoaded', () => {
      if (prefersReducedMotion()) {
        document.querySelectorAll('[data-word]').forEach(el => (el as HTMLElement).style.transform = 'translateY(0)');
        document.querySelectorAll('[data-mword]').forEach(el => (el as HTMLElement).style.opacity = '1');
        return;
      }
      playHero();
      initManifesto();
      initFourWorlds();
    });
  </script>
</Base>
```

- [ ] **Step 4: Browser verify**

`npm run dev`. Scroll past manifesto. Expected: section pins, four panels scroll horizontally as you continue scrolling down. Each panel: giant sector name + image in clipped shape + bullet tags. Tick underline expands for active panel. Particle field color/density morphs between presets.

- [ ] **Step 5: Mobile verify**

Resize viewport < 768px. Expected: panels stack vertically, no horizontal scroll.

- [ ] **Step 6: Reduced-motion verify**

Emulate reduce → no pin, all four panels visible, stacked.

- [ ] **Step 7: Build verify**

Run: `npm run build && npm run check` — pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: homepage four worlds — horizontal pinned scroll with preset morphing"
```

---

## Task 12: Homepage Act 04 · Epsilon Cameo (3D fitting teaser)

**Files:**
- Create: `src/components/sections/EpsilonCameo.astro`
- Create: `src/scripts/motion/timelines/epsilonCameo.ts`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create `src/components/sections/EpsilonCameo.astro`**

```astro
---
import Button from '~/components/ui/Button.astro';
---
<section data-section="epsilon-cameo" class="relative z-10 min-h-[120vh] flex items-center px-[var(--margin)]" aria-label="Epsilon Series product cameo">
  <div class="grid grid-cols-12 gap-6 w-full items-center">
    <div class="col-span-12 md:col-span-7 relative h-[70vh]">
      <div data-cameo-stage class="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 400 400" class="w-full h-full max-w-[560px]" aria-hidden="true">
          <g data-cameo-part="body"><ellipse cx="200" cy="200" rx="140" ry="44" fill="none" stroke="#aee4be" stroke-width="1.5" /></g>
          <g data-cameo-part="oring" transform="translate(200 200)"><circle r="32" fill="none" stroke="#aee4be" stroke-width="1" /></g>
          <g data-cameo-part="collet" transform="translate(200 200)"><path d="M -50 -14 L -36 -14 L -36 14 L -50 14 Z M 50 -14 L 36 -14 L 36 14 L 50 14 Z" fill="none" stroke="#aee4be" stroke-width="1" /></g>
          <g data-cameo-part="insert" transform="translate(200 200)"><rect x="-72" y="-10" width="144" height="20" fill="none" stroke="#aee4be" stroke-width="0.8" /></g>
          <g data-cameo-part="nut" transform="translate(200 200)"><polygon points="-120,-28 -100,-36 100,-36 120,-28 100,-20 -100,-20" fill="none" stroke="#aee4be" stroke-width="1" /></g>
        </svg>
      </div>
    </div>
    <div class="col-span-12 md:col-span-5">
      <p class="mono text-text-mono mb-4">IV · Featured Series</p>
      <h2 class="display-lg font-display font-medium leading-[0.9] tracking-[-0.02em]">Engineered<br/>to <span class="serif-italic">fit.</span></h2>
      <p class="mt-6 max-w-md text-text-secondary">Five precision components. One universally compatible compression system.</p>
      <div class="mt-10"><Button variant="primary" href="/products/epsilon">Explore Epsilon</Button></div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Create `src/scripts/motion/timelines/epsilonCameo.ts`**

```ts
import { gsap, ScrollTrigger, registerGSAP } from '../registerGSAP';

export function initEpsilonCameo() {
  registerGSAP();
  const section = document.querySelector('[data-section="epsilon-cameo"]') as HTMLElement | null;
  if (!section) return;

  const idle = gsap.to('[data-cameo-stage] svg', { rotate: 360, duration: 40, repeat: -1, ease: 'none' });

  ScrollTrigger.create({
    trigger: section,
    start: 'top 70%',
    end: 'bottom 30%',
    scrub: 0.6,
    animation: gsap.timeline()
      .from('[data-cameo-part="body"]',   { scale: 1.2, opacity: 0, duration: 1 }, 0)
      .from('[data-cameo-part="oring"]',  { scale: 0.5, opacity: 0, duration: 1 }, 0.2)
      .from('[data-cameo-part="collet"]', { x: -100, opacity: 0, duration: 1 }, 0.4)
      .from('[data-cameo-part="insert"]', { x: 100, opacity: 0, duration: 1 }, 0.6)
      .from('[data-cameo-part="nut"]',    { y: -60, opacity: 0, duration: 1 }, 0.8)
  });

  ScrollTrigger.create({
    trigger: section,
    start: 'top 60%',
    end: 'bottom 40%',
    onEnter:     () => (window as any).__flow?.setPreset('epsilon', 1000),
    onLeaveBack: () => (window as any).__flow?.setPreset('industry', 800)
  });
}
```

- [ ] **Step 3: Wire into `src/pages/index.astro`**

Import EpsilonCameo and call `initEpsilonCameo()` in DOMContentLoaded block.

- [ ] **Step 4: Browser verify**

Dev server. Scroll to Epsilon Cameo after Four Worlds. Expected: centered fitting illustration with slow idle rotation; as you scroll into the section, components enter staggered (body first, then oring, collet, insert, nut). Headline and CTA on the right. Clicking button links to `/products/epsilon` (will 404 for now, that's fine).

- [ ] **Step 5: Build verify**

Run: `npm run build && npm run check` — pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: homepage epsilon cameo — parts reveal on scroll, rotating stage, CTA"
```

---

## Task 13: Homepage Act 05 · Counters

**Files:**
- Create: `src/components/sections/Counters.astro`
- Create: `src/scripts/motion/timelines/counters.ts`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create `src/components/sections/Counters.astro`**

```astro
---
import { companyStats } from '~/data/stats';
const items = [
  { target: companyStats.yearsActive, suffix: '',  label: 'Years active',    caption: 'Since 1979' },
  { target: companyStats.productCodes, suffix: '+', label: 'Product codes',  caption: 'Across 4 sectors' },
  { target: companyStats.countries,    suffix: '',  label: 'Countries',      caption: 'HQ Cyprus · factories EG · DE' }
];
---
<section data-section="counters" class="relative z-10 min-h-screen flex items-center px-[var(--margin)]" aria-label="Elysee by the numbers">
  <div class="w-full grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
    {items.map((it, i) => (
      <div>
        <p class="mono text-text-mono mb-4">0{i + 1}</p>
        <p class="display-lg font-display tracking-[-0.02em] leading-none" data-counter data-target={it.target} data-suffix={it.suffix}>0</p>
        <p class="mt-6 text-text-primary">{it.label}</p>
        <p class="mono text-text-mono mt-2">{it.caption}</p>
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 2: Create `src/scripts/motion/timelines/counters.ts`**

```ts
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
```

- [ ] **Step 3: Wire into index.astro**

Import Counters + call `initCounters()` in DOMContentLoaded.

- [ ] **Step 4: Browser verify**

Scroll to counters section. Expected: three giant numbers count up from 0 (46, 5,000+, 65), each has a small mono `01/02/03` label above and description below. No flicker after completion.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: homepage counters — scroll-triggered number tweens with formatting"
```

---

## Task 14: Homepage Act 06 · Global Reach (SVG map + flow lines)

**Files:**
- Create: `src/components/sections/GlobalMap.astro`
- Create: `src/scripts/motion/timelines/globalMap.ts`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create `src/components/sections/GlobalMap.astro`**

```astro
---
import { hq, markets } from '~/data/globalMap';

// Equirectangular projection: lon [-180,180] -> x [0, 1200], lat [90,-90] -> y [0, 600]
function project(lng: number, lat: number) {
  const x = (lng + 180) / 360 * 1200;
  const y = (90 - lat) / 180 * 600;
  return [x, y] as const;
}

const [hqX, hqY] = project(hq.lng, hq.lat);
const lines = markets.map(m => {
  const [x, y] = project(m.lng, m.lat);
  // Quadratic control for a gentle arc
  const mx = (hqX + x) / 2;
  const my = Math.min(hqY, y) - 40;
  return { path: `M ${hqX} ${hqY} Q ${mx} ${my} ${x} ${y}`, end: [x, y] as const, label: m.label, primary: !!m.primary };
});
---
<section data-section="global-map" class="relative z-10 min-h-screen flex items-center px-[var(--margin)]" aria-label="Global reach">
  <div class="w-full">
    <p class="mono text-text-mono mb-4">VI · Global reach</p>
    <h2 class="display-md font-display tracking-[-0.02em] mb-12">Engineered in Cyprus.<br/><span class="serif-italic">Carried worldwide.</span></h2>
    <div class="relative aspect-[2/1] w-full rounded-md overflow-hidden border border-hairline" style="background: linear-gradient(135deg, #0d1f16 0%, #0a1410 100%);">
      <svg viewBox="0 0 1200 600" class="absolute inset-0 w-full h-full">
        <circle cx={hqX} cy={hqY} r="5" fill="#aee4be" />
        <circle cx={hqX} cy={hqY} r="14" fill="none" stroke="#aee4be" stroke-width="0.8" opacity="0.5">
          <animate attributeName="r" values="8;22;8" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
        </circle>
        {lines.map((l, i) => (
          <g>
            <path data-map-line d={l.path} stroke={l.primary ? '#aee4be' : '#7eb08c'} stroke-width={l.primary ? '1.5' : '1'} fill="none" stroke-dasharray="2000" stroke-dashoffset="2000" opacity={l.primary ? '0.9' : '0.5'} />
            <circle data-map-dot data-index={i} cx={l.end[0]} cy={l.end[1]} r="3" fill={l.primary ? '#aee4be' : '#7eb08c'} opacity="0" />
          </g>
        ))}
      </svg>
    </div>
    <p class="mono text-text-mono mt-6">HQ CYPRUS · EGYPT · GERMANY · SPAIN · MOROCCO · CROATIA · KENYA · SAUDI ARABIA</p>
  </div>
</section>
```

- [ ] **Step 2: Create `src/scripts/motion/timelines/globalMap.ts`**

```ts
import { gsap, ScrollTrigger, registerGSAP } from '../registerGSAP';

export function initGlobalMap() {
  registerGSAP();
  const section = document.querySelector('[data-section="global-map"]') as HTMLElement | null;
  if (!section) return;

  ScrollTrigger.create({
    trigger: section,
    start: 'top 65%',
    once: true,
    onEnter: () => {
      const lines = gsap.utils.toArray<SVGPathElement>('[data-map-line]');
      const dots  = gsap.utils.toArray<SVGCircleElement>('[data-map-dot]');
      lines.forEach((line, i) => {
        gsap.to(line, { strokeDashoffset: 0, duration: 1.1, delay: i * 0.18, ease: 'power2.inOut' });
        gsap.to(dots[i],  { opacity: 1, duration: 0.3, delay: i * 0.18 + 0.9 });
        gsap.fromTo(dots[i], { scale: 0.4, transformOrigin: 'center center' }, { scale: 1.4, duration: 0.25, delay: i * 0.18 + 0.9, yoyo: true, repeat: 1 });
      });
      (window as any).__flow?.setPreset('map', 1200);
    }
  });
}
```

- [ ] **Step 3: Wire into index.astro**

Import GlobalMap + call `initGlobalMap()` in DOMContentLoaded.

- [ ] **Step 4: Browser verify**

Scroll to Global Reach. Expected: title, stylized map box, HQ dot with pulsing ring. When in view, flow lines draw out from HQ to each market in sequence, with end-dots popping. Below: mono ticker text.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: homepage global map — SVG projection with sequenced flow lines"
```

---

## Task 15: Homepage Act 07 · Insights marquee + Act 08 · Contact Footer

**Files:**
- Create: `src/components/sections/Insights.astro`
- Create: `src/components/sections/ContactFooter.astro`
- Create: `src/scripts/motion/timelines/insightsMarquee.ts`
- Create: `src/scripts/motion/timelines/contactFooter.ts`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create `src/components/sections/Insights.astro`**

```astro
---
import { getCollection } from 'astro:content';
const insights = (await getCollection('insights')).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---
<section data-section="insights" id="insights" class="relative z-10 min-h-[80vh] py-24" aria-label="Latest insights">
  <header class="px-[var(--margin)] mb-10 flex items-end justify-between">
    <div>
      <p class="mono text-text-mono mb-3">VII · Insights</p>
      <h2 class="display-md font-display tracking-[-0.02em]">Latest <span class="serif-italic">signals.</span></h2>
    </div>
    <a href="#" class="mono text-text-mono hover:text-accent-bright">View all →</a>
  </header>

  <div data-insights-track class="flex gap-8 overflow-x-auto scroll-smooth cursor-grab pl-[var(--margin)]" role="list">
    {insights.map(it => (
      <article role="listitem" class="flex-shrink-0 w-[min(520px,80vw)] group">
        <div class="aspect-[4/3] overflow-hidden rounded-md bg-surface-relief">
          <img src={it.data.cover} alt={it.data.title} class="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]" loading="lazy" />
        </div>
        <div class="mt-4 flex items-center gap-3 mono text-text-mono">
          <span>{it.data.tag}</span>
          <span class="h-px flex-1 bg-hairline"></span>
          <time datetime={it.data.date.toISOString()}>{it.data.date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</time>
        </div>
        <h3 class="mt-3 font-display text-2xl leading-tight">{it.data.title}</h3>
        <p class="mt-2 text-text-secondary max-w-md">{it.data.excerpt}</p>
      </article>
    ))}
    <div class="flex-shrink-0 w-[var(--margin)]"></div>
  </div>
</section>
```

- [ ] **Step 2: Create `src/scripts/motion/timelines/insightsMarquee.ts`**

```ts
import { gsap, Observer, registerGSAP } from '../registerGSAP';

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
```

- [ ] **Step 3: Create `src/components/sections/ContactFooter.astro`**

```astro
---
---
<section data-section="contact" id="contact" class="relative z-10 min-h-[90vh] px-[var(--margin)] pt-32 pb-12">
  <p class="mono text-text-mono mb-6">VIII · Say hello</p>
  <h2 class="display-xl font-display tracking-[-0.025em] leading-[0.88]" data-contact-headline>
    <span>Let's make</span><br/>
    <span>things <span class="serif-italic">grow.</span></span>
  </h2>

  <div class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl">
    <div>
      <p class="mono text-text-mono mb-3">Head office</p>
      <p class="text-text-primary">5 Pentadaktylou St.<br/>Ergates Industrial Zone<br/>2643 Nicosia, Cyprus</p>
    </div>
    <div>
      <p class="mono text-text-mono mb-3">Talk to us</p>
      <p><a href="tel:+35722455000" class="hover:text-accent-bright">+357 22 455 000</a></p>
      <p><a href="mailto:info@elysee.com.cy" class="hover:text-accent-bright">info@elysee.com.cy</a></p>
    </div>
    <div>
      <p class="mono text-text-mono mb-3">Elsewhere</p>
      <ul class="space-y-1">
        <li><a href="#" class="hover:text-accent-bright">LinkedIn</a></li>
        <li><a href="#" class="hover:text-accent-bright">YouTube</a></li>
        <li><a href="#" class="hover:text-accent-bright">Facebook</a></li>
        <li><a href="#" class="hover:text-accent-bright">X / Twitter</a></li>
      </ul>
    </div>
  </div>

  <div class="mt-32 overflow-hidden" aria-hidden="true">
    <div data-footer-marquee class="whitespace-nowrap will-change-transform font-display tracking-[-0.03em] opacity-60" style="font-size: clamp(120px, 18vw, 260px);">
      <span class="inline-block pr-8">ELYSEE</span><span class="inline-block pr-8">ELYSEE</span><span class="inline-block pr-8">ELYSEE</span><span class="inline-block pr-8">ELYSEE</span>
    </div>
  </div>

  <div class="mt-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-8 border-t border-hairline mono text-text-mono">
    <p>© 2026 Elysee Irrigation Ltd.</p>
    <p>Streaming water. Streaming life.</p>
    <nav class="flex gap-6">
      <a href="#" class="hover:text-accent-bright">Terms</a>
      <a href="#" class="hover:text-accent-bright">Privacy</a>
      <a href="#" class="hover:text-accent-bright">Supply</a>
    </nav>
  </div>
</section>
```

- [ ] **Step 4: Create `src/scripts/motion/timelines/contactFooter.ts`**

```ts
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
```

- [ ] **Step 5: Wire into index.astro**

```astro
---
import Base from '~/layouts/Base.astro';
import ParticleFlow from '~/components/hero/ParticleFlow.astro';
import Hero from '~/components/sections/Hero.astro';
import Manifesto from '~/components/sections/Manifesto.astro';
import FourWorlds from '~/components/sections/FourWorlds.astro';
import EpsilonCameo from '~/components/sections/EpsilonCameo.astro';
import Counters from '~/components/sections/Counters.astro';
import GlobalMap from '~/components/sections/GlobalMap.astro';
import Insights from '~/components/sections/Insights.astro';
import ContactFooter from '~/components/sections/ContactFooter.astro';
---
<Base title="Elysee Irrigation — Streaming water, streaming life">
  <ParticleFlow />
  <Hero />
  <Manifesto />
  <FourWorlds />
  <EpsilonCameo />
  <Counters />
  <GlobalMap />
  <Insights />
  <ContactFooter />

  <script>
    import { playHero } from '~/scripts/motion/timelines/hero';
    import { initManifesto } from '~/scripts/motion/timelines/manifesto';
    import { initFourWorlds } from '~/scripts/motion/timelines/fourWorlds';
    import { initEpsilonCameo } from '~/scripts/motion/timelines/epsilonCameo';
    import { initCounters } from '~/scripts/motion/timelines/counters';
    import { initGlobalMap } from '~/scripts/motion/timelines/globalMap';
    import { initInsightsMarquee } from '~/scripts/motion/timelines/insightsMarquee';
    import { initContactFooter } from '~/scripts/motion/timelines/contactFooter';
    import { prefersReducedMotion } from '~/scripts/utils/reducedMotion';

    window.addEventListener('DOMContentLoaded', () => {
      if (prefersReducedMotion()) {
        document.querySelectorAll('[data-word]').forEach(el => (el as HTMLElement).style.transform = 'translateY(0)');
        document.querySelectorAll('[data-mword]').forEach(el => (el as HTMLElement).style.opacity = '1');
        document.querySelectorAll<HTMLElement>('[data-counter]').forEach(el => {
          const t = el.dataset.target ?? '0'; const s = el.dataset.suffix ?? '';
          el.textContent = Number(t).toLocaleString('en-US') + s;
        });
        return;
      }
      playHero();
      initManifesto();
      initFourWorlds();
      initEpsilonCameo();
      initCounters();
      initGlobalMap();
      initInsightsMarquee();
      initContactFooter();
    });
  </script>
</Base>
```

- [ ] **Step 6: Browser verify (full page scroll)**

Run: `npm run dev`. Scroll through the entire homepage. Each section behaves as specified. No console errors. Lighthouse perf panel runs cleanly.

- [ ] **Step 7: Reduced-motion verify**

Emulate reduce → all content visible, no pins, no scrubbing, no marquee.

- [ ] **Step 8: Build verify**

Run: `npm run build && npm run check` — pass.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: homepage insights marquee + contact footer with velocity-reactive marquee"
```

---

## Task 16: Products index page + filter rail + FLIP

**Files:**
- Create: `src/components/products/ProductCard.astro`
- Create: `src/components/products/FilterRail.astro`
- Create: `src/pages/products/index.astro`
- Create: `src/scripts/motion/timelines/productsFilter.ts`

- [ ] **Step 1: Create `src/components/products/ProductCard.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
interface Props { product: CollectionEntry<'products'>; featured?: boolean }
const { product, featured = false } = Astro.props;
---
<a
  href={`/products/${product.slug}`}
  data-product-card
  data-category={product.data.category}
  class:list={[
    'group relative overflow-hidden rounded-md bg-surface-relief border border-hairline transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 hover:border-accent-primary',
    featured ? 'col-span-2 row-span-2 aspect-square' : 'aspect-[4/5]'
  ]}
>
  {featured && (
    <span class="absolute top-4 left-4 mono text-accent-bright z-10">FEATURED</span>
  )}
  <div class="absolute inset-0">
    <img src={product.data.image} alt={product.data.name} class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" loading="lazy" />
    <div class="absolute inset-0 bg-gradient-to-t from-surface-deep via-transparent to-transparent"></div>
  </div>
  <div class="absolute bottom-0 left-0 right-0 p-6">
    <p class="mono text-text-mono mb-2">{product.data.category.replace(/-/g, ' ')}</p>
    <h3 class="font-display text-2xl leading-tight">{product.data.name}</h3>
    <p class="mt-2 text-text-secondary text-sm max-w-xs">{product.data.blurb}</p>
    <div class="mt-4 flex flex-wrap gap-2 opacity-0 translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
      <span class="mono border border-hairline px-2 py-1 rounded-full text-[9px]">{product.data.pressure}</span>
      <span class="mono border border-hairline px-2 py-1 rounded-full text-[9px]">{product.data.sizeRange}</span>
    </div>
  </div>
</a>
```

- [ ] **Step 2: Create `src/components/products/FilterRail.astro`**

```astro
---
const categories = [
  { slug: 'all', label: 'All' },
  { slug: 'compression-fittings', label: 'Compression Fittings' },
  { slug: 'pvc-ball-valves', label: 'PVC Ball Valves' },
  { slug: 'saddles', label: 'Saddles' },
  { slug: 'adaptor-flanged', label: 'Adaptor Flanged' },
  { slug: 'couplings', label: 'Couplings' },
  { slug: 'valves', label: 'Valves' }
];
---
<aside data-filter-rail class="sticky top-24 self-start">
  <p class="mono text-text-mono mb-4">Filter</p>
  <ul class="flex md:flex-col flex-wrap gap-2">
    {categories.map(c => (
      <li>
        <button
          data-filter
          data-active={c.slug === 'all' ? 'true' : 'false'}
          data-slug={c.slug}
          class="group relative mono uppercase tracking-[0.18em] text-xs py-1 px-0 text-text-secondary data-[active=true]:text-accent-bright transition-colors"
        >
          <span class="relative">
            {c.label}
            <span data-filter-underline class="absolute left-0 -bottom-1 h-px bg-accent-bright origin-left scale-x-0 w-full transition-transform duration-500 group-data-[active=true]:scale-x-100"></span>
          </span>
        </button>
      </li>
    ))}
  </ul>
</aside>
```

- [ ] **Step 3: Create `src/pages/products/index.astro`**

```astro
---
import Base from '~/layouts/Base.astro';
import ParticleFlow from '~/components/hero/ParticleFlow.astro';
import ProductCard from '~/components/products/ProductCard.astro';
import FilterRail from '~/components/products/FilterRail.astro';
import { getCollection } from 'astro:content';

const products = (await getCollection('products')).sort((a, b) => (b.data.featured ? 1 : 0) - (a.data.featured ? 1 : 0));
---
<Base title="Products — Elysee Irrigation" description="5,000+ product codes across four sectors. Compression fittings, valves, saddles, couplings.">
  <ParticleFlow />
  <section class="relative z-10 min-h-[60vh] flex items-end px-[var(--margin)] pb-24 pt-32">
    <div>
      <p class="mono text-text-mono mb-4">Products</p>
      <h1 class="display-xl font-display tracking-[-0.025em] leading-[0.88]">Products<span class="serif-italic">.</span></h1>
      <p class="mono text-text-secondary mt-6">5,000+ codes · 4 sectors · 65 countries</p>
    </div>
  </section>

  <section class="relative z-10 grid grid-cols-12 gap-6 px-[var(--margin)] pb-32">
    <div class="col-span-12 md:col-span-3 lg:col-span-2"><FilterRail /></div>
    <div class="col-span-12 md:col-span-9 lg:col-span-10">
      <div data-products-grid class="grid grid-cols-2 md:grid-cols-3 gap-6 auto-rows-[minmax(240px,auto)]">
        {products.map(p => <ProductCard product={p} featured={p.data.featured} />)}
      </div>
    </div>
  </section>

  <section class="relative z-10 border-t border-hairline py-24 px-[var(--margin)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
    <h2 class="display-sm font-display">Not sure which fitting fits?</h2>
    <a href="/#contact" class="mono text-accent-bright hover:text-text-primary">Talk to an engineer →</a>
  </section>

  <script>
    import { initProductsFilter } from '~/scripts/motion/timelines/productsFilter';
    window.addEventListener('DOMContentLoaded', () => initProductsFilter());
  </script>
</Base>
```

- [ ] **Step 4: Create `src/scripts/motion/timelines/productsFilter.ts`**

```ts
import { gsap, Flip, registerGSAP } from '../registerGSAP';

export function initProductsFilter() {
  registerGSAP();
  const filters = document.querySelectorAll<HTMLButtonElement>('[data-filter]');
  const cards   = document.querySelectorAll<HTMLElement>('[data-product-card]');
  if (!filters.length || !cards.length) return;

  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      const slug = btn.dataset.slug!;
      filters.forEach(f => f.setAttribute('data-active', String(f.dataset.slug === slug)));

      const state = Flip.getState(cards);
      cards.forEach(c => {
        const match = slug === 'all' || c.dataset.category === slug;
        c.style.display = match ? '' : 'none';
      });
      Flip.from(state, {
        duration: 0.7, ease: 'expo.inOut', absolute: true,
        onEnter:    (el) => gsap.fromTo(el, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.5 }),
        onLeave:    (el) => gsap.to(el, { opacity: 0, scale: 0.92, duration: 0.35 })
      });
    });
  });
}
```

- [ ] **Step 5: Browser verify**

Open http://localhost:4321/products. Expected: hero strip with "Products.", then filter rail on left, grid of product cards on right with Epsilon featured (2x size). Click a filter — cards transition into new positions with FLIP animation. Hover card → lifts, spec chips appear. Particle background persists.

- [ ] **Step 6: Build verify**

`npm run build && npm run check` — pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: products index — filter rail with FLIP transitions, featured epsilon card"
```

---

## Task 17: Epsilon deep-dive E1 · Reveal + E2 · Disassembly

**Files:**
- Create: `src/components/products/EpsilonStage.astro`
- Create: `src/pages/products/epsilon.astro`
- Create: `src/scripts/motion/timelines/epsilonPage.ts`

- [ ] **Step 1: Create `src/components/products/EpsilonStage.astro`**

Reuse the same SVG schematic as the cameo, scaled up and with named part groups for scrubbed disassembly:

```astro
---
---
<svg data-epsilon-stage viewBox="0 0 800 500" class="w-full h-full" role="img" aria-label="Epsilon Series compression fitting exploded view">
  <g data-epart="nut"    transform="translate(400 250)"><polygon points="-260,-56 -220,-72 220,-72 260,-56 220,-40 -220,-40" fill="none" stroke="#aee4be" stroke-width="1.2" /></g>
  <g data-epart="insert" transform="translate(400 250)"><rect x="-150" y="-22" width="300" height="44" fill="none" stroke="#aee4be" stroke-width="1" /></g>
  <g data-epart="collet" transform="translate(400 250)"><path d="M -100 -30 L -76 -30 L -76 30 L -100 30 Z M 100 -30 L 76 -30 L 76 30 L 100 30 Z" fill="none" stroke="#aee4be" stroke-width="1" /></g>
  <g data-epart="oring"  transform="translate(400 250)"><circle r="64" fill="none" stroke="#aee4be" stroke-width="1" /></g>
  <g data-epart="body"   transform="translate(400 250)"><ellipse rx="290" ry="94" fill="none" stroke="#aee4be" stroke-width="1.4" /></g>

  <g data-epart-label="body" class="hidden" transform="translate(100 140)" fill="#aee4be" font-family="JetBrains Mono" font-size="10" letter-spacing="1.8">
    <line x1="0" y1="0" x2="280" y2="0" stroke="#aee4be" stroke-width="0.6" />
    <text x="0" y="-6">01 · BODY</text>
  </g>
  <g data-epart-label="oring" class="hidden" transform="translate(640 140)" fill="#aee4be" font-family="JetBrains Mono" font-size="10" letter-spacing="1.8">
    <text x="0" y="-6">02 · O-RING</text>
  </g>
  <g data-epart-label="collet" class="hidden" transform="translate(100 380)" fill="#aee4be" font-family="JetBrains Mono" font-size="10" letter-spacing="1.8">
    <text x="0" y="-6">03 · COLLET</text>
  </g>
  <g data-epart-label="insert" class="hidden" transform="translate(640 380)" fill="#aee4be" font-family="JetBrains Mono" font-size="10" letter-spacing="1.8">
    <text x="0" y="-6">04 · INSERT</text>
  </g>
  <g data-epart-label="nut" class="hidden" transform="translate(640 80)" fill="#aee4be" font-family="JetBrains Mono" font-size="10" letter-spacing="1.8">
    <text x="0" y="-6">05 · NUT</text>
  </g>
</svg>
```

- [ ] **Step 2: Create `src/pages/products/epsilon.astro`**

```astro
---
import Base from '~/layouts/Base.astro';
import ParticleFlow from '~/components/hero/ParticleFlow.astro';
import EpsilonStage from '~/components/products/EpsilonStage.astro';
import Button from '~/components/ui/Button.astro';
import { getEntry, getCollection } from 'astro:content';

const epsilon = await getEntry('products', 'epsilon');
if (!epsilon) throw new Error('Epsilon product not found');
const related = (await getCollection('products')).filter(p => p.data.category === epsilon.data.category && p.slug !== 'epsilon').slice(0, 4);
---
<Base title="Epsilon Series — Elysee Irrigation" description={epsilon.data.blurb}>
  <ParticleFlow />

  <section data-section="e1-reveal" class="relative z-10 min-h-screen flex items-center justify-center px-[var(--margin)]">
    <div class="text-center">
      <p class="mono text-text-mono mb-6" data-e1-subline>ε · EPSILON SERIES</p>
      <h1 class="display-xl font-display tracking-[-0.025em] leading-[0.9]" data-e1-title>Compression,<br/><span class="serif-italic">perfected.</span></h1>
      <p class="mono text-text-secondary mt-8 opacity-0" data-e1-tagline>{epsilon.data.blurb}</p>
    </div>
  </section>

  <section data-section="e2-disassembly" class="relative z-10">
    <div data-e2-pin class="h-screen flex items-center justify-center px-[var(--margin)]">
      <div class="w-full max-w-5xl aspect-[8/5] relative">
        <EpsilonStage />
      </div>
    </div>
  </section>

  <section data-section="e3-specs" class="relative z-10 min-h-screen px-[var(--margin)] py-24">
    <div class="grid grid-cols-12 gap-6">
      <div class="col-span-12 md:col-span-5">
        <p class="mono text-text-mono mb-4">III · Specs</p>
        <h2 class="display-md font-display tracking-[-0.02em]">Built to<br/><span class="serif-italic">standard.</span></h2>
      </div>
      <div class="col-span-12 md:col-span-7">
        <dl class="divide-y divide-hairline" data-e3-list>
          {epsilon.data.specs.map(s => (
            <div class="py-4 grid grid-cols-12 gap-4 opacity-0 translate-y-3" data-e3-row>
              <dt class="col-span-5 mono text-text-mono">{s.key}</dt>
              <dd class="col-span-7 text-text-primary">{s.value}</dd>
            </div>
          ))}
        </dl>
        <div class="mt-12 flex flex-wrap gap-3">
          <Button variant="primary" href={epsilon.data.datasheet ?? '#'}>Datasheet</Button>
          <Button variant="arrow" href="#">Installation</Button>
          <Button variant="arrow" href="#">BIM</Button>
          <Button variant="arrow" href="#">3D CAD</Button>
        </div>
      </div>
    </div>
  </section>

  <section data-section="e4-install" class="relative z-10 h-screen overflow-hidden">
    <div data-e4-pin class="h-full flex items-center px-[var(--margin)] gap-6">
      {[1,2,3,4].map(step => (
        <figure data-e4-frame data-step={step} class="flex-shrink-0 w-[80vw] md:w-[42vw] aspect-[3/4] rounded-md overflow-hidden bg-surface-relief relative transition-opacity duration-500">
          <img src={`/images/products/epsilon-hero.jpg`} alt={`Installation step ${step}`} class="w-full h-full object-cover" loading="lazy" />
          <figcaption class="absolute bottom-0 left-0 right-0 p-6">
            <p class="mono text-accent-bright">STEP 0{step}</p>
            <p class="mono text-text-secondary mt-1">Installation phase {step} placeholder caption.</p>
          </figcaption>
        </figure>
      ))}
    </div>
  </section>

  <section data-section="e5-related" class="relative z-10 min-h-screen px-[var(--margin)] py-24">
    <header class="mb-12">
      <p class="mono text-text-mono mb-3">V · Compatible</p>
      <h2 class="display-md font-display tracking-[-0.02em]">Works with<span class="serif-italic">.</span></h2>
    </header>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {related.map(r => (
        <a href={`/products/${r.slug}`} class="group block">
          <div class="aspect-[4/5] overflow-hidden rounded-md bg-surface-relief"><img src={r.data.image} alt={r.data.name} class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" /></div>
          <p class="mono text-text-mono mt-3">{r.data.category.replace(/-/g, ' ')}</p>
          <h3 class="font-display text-xl mt-1">{r.data.name}</h3>
        </a>
      ))}
    </div>
    <div class="mt-24 text-center">
      <a href="/#contact" class="inline-block display-sm font-display tracking-[-0.02em] hover:text-accent-bright transition-colors">Talk to our engineers <span class="serif-italic">→</span></a>
    </div>
  </section>

  <script>
    import { initEpsilonPage } from '~/scripts/motion/timelines/epsilonPage';
    window.addEventListener('DOMContentLoaded', () => initEpsilonPage());
  </script>
</Base>
```

- [ ] **Step 3: Create `src/scripts/motion/timelines/epsilonPage.ts`**

```ts
import { gsap, ScrollTrigger, registerGSAP } from '../registerGSAP';
import { prefersReducedMotion } from '~/scripts/utils/reducedMotion';

export function initEpsilonPage() {
  registerGSAP();

  // --- E1 · Reveal (one-shot on load) ---
  const subline = document.querySelector('[data-e1-subline]');
  const title = document.querySelector('[data-e1-title]');
  const tagline = document.querySelector('[data-e1-tagline]');
  if (subline && title && tagline) {
    if (prefersReducedMotion()) {
      (tagline as HTMLElement).style.opacity = '1';
    } else {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from(subline, { opacity: 0, y: 10, duration: 0.6 })
        .from(title, { opacity: 0, y: 40, duration: 1.0 }, '-=0.3')
        .to(tagline, { opacity: 1, y: 0, duration: 0.5 }, '-=0.4');
    }
  }

  if (prefersReducedMotion()) {
    document.querySelectorAll<HTMLElement>('[data-e3-row]').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
    document.querySelectorAll<HTMLElement>('[data-epart-label]').forEach(el => el.classList.remove('hidden'));
    return;
  }

  // --- E2 · Disassembly (pinned, scrubbed) ---
  const e2 = document.querySelector('[data-e2-pin]') as HTMLElement | null;
  if (e2) {
    gsap.set('[data-epart-label]', { opacity: 0 });
    gsap.utils.toArray<HTMLElement>('[data-epart-label]').forEach(el => el.classList.remove('hidden'));

    ScrollTrigger.create({
      trigger: e2,
      start: 'top top',
      end: '+=300%',
      pin: true,
      scrub: 0.5,
      animation: gsap.timeline()
        .to('[data-epart="nut"]',    { y: -180, duration: 1 }, 0)
        .to('[data-epart-label="nut"]',    { opacity: 1, duration: 0.4 }, 0.3)
        .to('[data-epart="oring"]',  { x: 220, scale: 1.2, duration: 1 }, 0.3)
        .to('[data-epart-label="oring"]',  { opacity: 1, duration: 0.4 }, 0.6)
        .to('[data-epart="collet"]', { x: -200, duration: 1 }, 0.6)
        .to('[data-epart-label="collet"]', { opacity: 1, duration: 0.4 }, 0.9)
        .to('[data-epart="insert"]', { x: 260, duration: 1 }, 0.9)
        .to('[data-epart-label="insert"]', { opacity: 1, duration: 0.4 }, 1.2)
        .to('[data-epart="body"]',   { x: -260, scaleX: 1.1, duration: 1 }, 1.2)
        .to('[data-epart-label="body"]',   { opacity: 1, duration: 0.4 }, 1.5)
    });

    ScrollTrigger.create({
      trigger: e2,
      start: 'top 80%',
      end: 'bottom top',
      onEnter:     () => (window as any).__flow?.setPreset('epsilon', 1000),
      onLeaveBack: () => (window as any).__flow?.setPreset('hero', 800)
    });
  }

  // --- E3 · Spec rows ---
  ScrollTrigger.batch('[data-e3-row]', {
    onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, stagger: 0.06, duration: 0.5, ease: 'expo.out' }),
    start: 'top 80%'
  });

  // --- E4 · Install film strip ---
  const e4 = document.querySelector('[data-e4-pin]') as HTMLElement | null;
  const frames = gsap.utils.toArray<HTMLElement>('[data-e4-frame]');
  if (e4 && frames.length) {
    ScrollTrigger.create({
      trigger: '[data-section="e4-install"]',
      start: 'top top',
      end: () => `+=${window.innerWidth * (frames.length - 1)}`,
      pin: true,
      scrub: 0.5,
      animation: gsap.to(e4, { x: () => -((frames.length - 1) * (window.innerWidth * 0.42 + 24)), ease: 'none' }),
      onUpdate: (self) => {
        const idx = Math.round(self.progress * (frames.length - 1));
        frames.forEach((f, i) => { f.style.opacity = i === idx ? '1' : '0.4'; });
      }
    });
  }
}
```

- [ ] **Step 4: Browser verify**

Navigate to http://localhost:4321/products/epsilon. Expected:

- E1: centered title reveal on load.
- E2: scroll — section pins, SVG fitting parts fly outward as labels fade in one by one. Reverse scroll re-assembles.
- E3: spec rows cascade in.
- E4: pinned horizontal film strip of 4 steps, active step brighter.
- E5: related products grid + oversized "Talk to our engineers →" CTA.

No console errors.

- [ ] **Step 5: Reduced-motion verify**

Emulate reduce. Labels visible statically; no pins; page scrolls naturally.

- [ ] **Step 6: Build verify**

`npm run build && npm run check` — pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: epsilon deep-dive — 5-act reveal/disassembly/specs/install/related"
```

---

## Task 18: Custom cursor + polish

**Files:**
- Create: `src/components/ui/Cursor.astro`
- Modify: `src/layouts/Base.astro`

- [ ] **Step 1: Create `src/components/ui/Cursor.astro`**

```astro
---
---
<div data-cursor class="pointer-events-none fixed z-[60] top-0 left-0 h-2 w-2 rounded-full bg-accent-bright mix-blend-difference transition-[width,height,border-width] duration-200 ease-out" style="transform: translate3d(-50%, -50%, 0)"></div>

<script>
  import { hasFinePointer } from '~/scripts/utils/prefersPointer';
  import { prefersReducedMotion } from '~/scripts/utils/reducedMotion';

  if (hasFinePointer() && !prefersReducedMotion()) {
    const cursor = document.querySelector('[data-cursor]') as HTMLElement | null;
    if (cursor) {
      let x = window.innerWidth / 2, y = window.innerHeight / 2;
      let tx = x, ty = y;
      window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
      const loop = () => {
        x += (tx - x) * 0.22;
        y += (ty - y) * 0.22;
        cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        requestAnimationFrame(loop);
      };
      loop();

      const interactive = 'a, button, [data-cursor-hover]';
      document.addEventListener('mouseover', (e) => {
        if ((e.target as HTMLElement).closest(interactive)) {
          cursor.style.width = '32px';
          cursor.style.height = '32px';
          cursor.style.backgroundColor = 'transparent';
          cursor.style.border = '1px solid #aee4be';
        }
      });
      document.addEventListener('mouseout', (e) => {
        if ((e.target as HTMLElement).closest(interactive)) {
          cursor.style.width = '8px';
          cursor.style.height = '8px';
          cursor.style.backgroundColor = '#aee4be';
          cursor.style.border = '0';
        }
      });
    }
  } else {
    document.querySelector('[data-cursor]')?.remove();
  }
</script>

<style is:global>
  @media (pointer: fine) { html { cursor: none; } a, button { cursor: none; } }
</style>
```

- [ ] **Step 2: Add cursor to Base layout**

Modify `src/layouts/Base.astro` body:

```astro
<body class="bg-surface-deep text-text-primary min-h-screen">
  <Cursor />
  <Nav />
  <main><slot /></main>
  <script>
    import { initLenis } from '~/scripts/motion/lenis';
    initLenis();
  </script>
</body>
```

Add the import:

```astro
---
import '~/styles/tailwind.css';
import Meta from '~/components/ui/Meta.astro';
import Nav from '~/components/ui/Nav.astro';
import Cursor from '~/components/ui/Cursor.astro';
...
```

- [ ] **Step 3: Browser verify**

Desktop with fine pointer: small green dot follows cursor with inertia. Hover a link/button: becomes a 32px ring. Touch device or reduced-motion: no custom cursor; default cursor used.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: custom cursor with inertia, hover-ring, touch+reduced-motion fallbacks"
```

---

## Task 19: 404 page, sitemap, SEO, JSON-LD

**Files:**
- Create: `src/pages/404.astro`
- Modify: `src/components/ui/Meta.astro` (add JSON-LD slot)
- Modify: `src/pages/index.astro` (add Organization schema)
- Modify: `src/pages/products/epsilon.astro` (add Product schema)

- [ ] **Step 1: Create `src/pages/404.astro`**

```astro
---
import Base from '~/layouts/Base.astro';
---
<Base title="404 — Elysee Irrigation">
  <section class="relative z-10 min-h-screen flex flex-col items-center justify-center px-[var(--margin)] text-center">
    <p class="mono text-text-mono mb-6">404 · off the flow</p>
    <h1 class="display-xl font-display tracking-[-0.02em]">Lost<br/><span class="serif-italic">upstream.</span></h1>
    <a href="/" class="mono mt-12 text-accent-bright hover:text-text-primary">← Back to source</a>
  </section>
</Base>
```

- [ ] **Step 2: Extend `src/components/ui/Meta.astro` to accept JSON-LD**

Add to the `Props` interface and render:

```astro
---
interface Props {
  title: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
  jsonLd?: Record<string, any>;
}
const { title, description = 'Streaming water. Streaming life.', ogImage = '/og/default.jpg', canonical, jsonLd } = Astro.props;
const canonicalURL = canonical ?? new URL(Astro.url.pathname, Astro.site).href;
---
<!-- meta tags unchanged -->
{jsonLd && <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />}
```

Update `src/layouts/Base.astro` to forward `jsonLd`:

```astro
interface Props {
  title: string;
  description?: string;
  ogImage?: string;
  jsonLd?: Record<string, any>;
}
const { title, description, ogImage, jsonLd } = Astro.props;
// ...
<Meta title={title} description={description} ogImage={ogImage} jsonLd={jsonLd} />
```

- [ ] **Step 3: Add Organization JSON-LD to homepage**

`src/pages/index.astro`:

```astro
---
const org = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Elysee Irrigation Ltd.',
  url: 'https://elysee.com.cy',
  logo: 'https://elysee.com.cy/og/logo.png',
  foundingDate: '1979',
  sameAs: [
    'https://www.linkedin.com/company/elysee-irrigation-ltd',
    'https://www.facebook.com/ElyseeIrrigation',
    'https://twitter.com/ELYSEECY'
  ],
  address: {
    '@type': 'PostalAddress',
    streetAddress: '5 Pentadaktylou Street',
    addressLocality: 'Ergates',
    addressRegion: 'Nicosia',
    postalCode: '2643',
    addressCountry: 'CY'
  }
};
// ...existing imports
---
<Base title="..." jsonLd={org}>
  ...
</Base>
```

- [ ] **Step 4: Add Product JSON-LD on epsilon**

```astro
const productLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: epsilon.data.name,
  description: epsilon.data.blurb,
  brand: { '@type': 'Brand', name: 'Elysee Irrigation' },
  category: 'Compression Fittings',
  image: new URL(epsilon.data.image, Astro.site).href
};
// ...
<Base title="..." jsonLd={productLd}>
```

- [ ] **Step 5: Browser verify**

Navigate to /not-a-real-page → see 404. View source on `/` and `/products/epsilon` → see `<script type="application/ld+json">` with correct schema. Visit `/sitemap-index.xml` (Astro sitemap integration emits this at build).

- [ ] **Step 6: Build verify**

`npm run build`. Inspect `dist/sitemap-0.xml` — contains `/`, `/products/`, `/products/epsilon/`, `/404/`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: 404 page + JSON-LD organization & product schemas"
```

---

## Task 20: Accessibility audit + reduced-motion passes

**Files:**
- Modify (various): any section missing aria-labels, focus styles
- Modify: `src/styles/tailwind.css` (focus-visible ring)

- [ ] **Step 1: Add global focus-visible styles to `src/styles/tokens.css`**

Append:

```css
:focus-visible {
  outline: 2px solid var(--accent-bright);
  outline-offset: 3px;
  border-radius: 2px;
}
[data-cursor] { display: none; }
@media (pointer: fine) and (prefers-reduced-motion: no-preference) {
  [data-cursor] { display: block; }
}
```

- [ ] **Step 2: Add skip-to-content link to Base layout**

Modify `src/layouts/Base.astro` `<body>`:

```astro
<body>
  <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[70] focus:bg-surface-break focus:text-surface-deep focus:px-4 focus:py-2 focus:rounded">Skip to content</a>
  <Cursor />
  <Nav />
  <main id="main"><slot /></main>
  ...
```

Add utility class to `src/styles/tailwind.css` if not present:

```css
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.focus\:not-sr-only:focus { position: fixed; width: auto; height: auto; margin: 0; overflow: visible; clip: auto; white-space: normal; }
```

- [ ] **Step 3: Audit ARIA / semantic structure**

Go through each section component and ensure:

- Every `<section>` has either an `id` referenced by an `aria-labelledby`, or a visually-hidden `<h2>` if decorative.
- All images have non-empty `alt` (or `alt=""` for decorative + `aria-hidden`).
- All buttons / links have accessible names.
- Horizontal Four Worlds: verify all four `<article>` elements are in the DOM regardless of pin state (they already are).

Make targeted edits only where an audit reveals a gap.

- [ ] **Step 4: Keyboard test**

Tab through homepage. Expected: focus ring visible on every interactive element in order (Skip link → Elysee logo → nav links → Get in touch → sector "Explore" → Epsilon CTA → View all → footer links). No focus traps.

Tab through /products/epsilon. Expected: ordered focus through all interactive elements.

- [ ] **Step 5: Add ArrowLeft/ArrowRight handler for Four Worlds**

Append to `src/scripts/motion/timelines/fourWorlds.ts` inside `initFourWorlds()`:

```ts
  window.addEventListener('keydown', (e) => {
    const active = document.activeElement;
    const inPin = pin?.contains(active as Node);
    if (!inPin && e.target !== document.body) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const direction = e.key === 'ArrowRight' ? 1 : -1;
      const st = ScrollTrigger.getAll().find(x => x.trigger === pin);
      if (!st) return;
      const progress = st.progress;
      const target = Math.max(0, Math.min(1, progress + direction * (1 / (total - 1))));
      const scrollPos = st.start + (st.end - st.start) * target;
      window.scrollTo({ top: scrollPos, behavior: 'smooth' });
      e.preventDefault();
    }
  });
```

- [ ] **Step 6: Browser verify (keyboard)**

On homepage, scroll into Four Worlds so it pins, then tab until focus is in the pin region. Press ArrowRight → advances to next sector panel. ArrowLeft → previous. Works without needing mouse.

- [ ] **Step 7: Build verify**

`npm run build && npm run check` — pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: accessibility — skip link, focus-visible, keyboard arrows for four-worlds"
```

---

## Task 21: Performance pass + Lighthouse target

**Files:**
- Modify: `astro.config.mjs` (add compress, image optimization)
- Modify: various images (responsive `<picture>` where heavy)

- [ ] **Step 1: Install compression integration**

```bash
npm install astro-compress
```

- [ ] **Step 2: Add compression + image optimization to `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import compress from 'astro-compress';

export default defineConfig({
  site: 'https://elysee.com.cy',
  integrations: [mdx(), sitemap(), compress({ HTML: true, CSS: true, JavaScript: true, SVG: true, Image: false })],
  image: { service: { entrypoint: 'astro/assets/services/sharp' } },
  vite: { plugins: [tailwindcss()], ssr: { noExternal: ['gsap', 'ogl', 'lenis'] } },
  experimental: { clientPrerender: true }
});
```

- [ ] **Step 3: Preload hero image** (if there's a hero image pre-LCP)

Since hero is type-only, LCP is the headline — already preloaded via font preload. No hero image preload needed.

- [ ] **Step 4: Swap img tags for Astro `<Image>` where appropriate**

In `ProductCard.astro`, `FourWorlds.astro`, `Insights.astro`, `EpsilonStage.astro`:

Replace `<img src={...} alt={...} />` with:

```astro
---
import { Image } from 'astro:assets';
// ...
---
<Image src={import(`${product.data.image}`)} alt={product.data.name} width={800} height={1000} loading="lazy" />
```

Note: since MDX references images by string path in `public/`, Astro `<Image>` can't transform them directly. Keep `<img>` for those, but ensure width/height attributes are set to avoid CLS:

```astro
<img src={product.data.image} alt={product.data.name} width="800" height="1000" loading="lazy" class="w-full h-full object-cover" />
```

Apply this across card components.

- [ ] **Step 5: Audit JS bundle**

Run: `npm run build`
Inspect `dist/_astro/` — confirm GSAP + OGL + Lenis are tree-shaken. If `gsap.js` chunk exceeds 90KB gz, verify only used plugins are imported.

- [ ] **Step 6: Run Lighthouse**

Run: `npm run build && npm run preview`
In another terminal or Chrome DevTools → Lighthouse → Desktop → Performance + Accessibility + SEO + Best Practices. Target: ≥ 95 on each.

If any category < 95, investigate the top opportunity: likely image sizing, unused JS, font-display. Fix and re-run.

Document results in a `docs/superpowers/lighthouse-results.md` file with timestamps.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "perf: compression integration, explicit img dimensions, lighthouse >=95"
```

---

## Task 22: README + handoff docs

**Files:**
- Create: `README.md`
- Create: `docs/TOKENS.md`
- Create: `docs/ADDING-A-PRODUCT.md`
- Create: `docs/ADDING-A-SECTOR-PRESET.md`

- [ ] **Step 1: Create `README.md`**

```markdown
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
```

- [ ] **Step 2: Create `docs/TOKENS.md`**

```markdown
# Design Tokens

Defined in `src/styles/tokens.css` as CSS custom properties. Mirrored in `src/styles/tailwind.css` as Tailwind theme values. Update both if you change a token.

## Colors
| Token | Hex | Role |
...(copy from spec)
```

Copy the color/typography/grid table from the spec.

- [ ] **Step 3: Create `docs/ADDING-A-PRODUCT.md`**

```markdown
# Adding a product

1. Create `src/content/products/<slug>.mdx` with frontmatter matching the schema in `src/content/config.ts`:

   \`\`\`yaml
   ---
   name: "…"
   category: one-of: compression-fittings | pvc-ball-valves | saddles | adaptor-flanged | couplings | valves
   blurb: "…"
   pressure: "16 bar"
   sizeRange: "Ø20–Ø110"
   featured: false
   image: /images/products/<slug>.jpg
   specs:
     - { key: Material, value: "…" }
   ---
   \`\`\`

2. Add the product image to `public/images/products/`.
3. Run `npm run dev` — the card appears at `/products`. The detail page at `/products/<slug>` will 404 until you create a corresponding `src/pages/products/[slug].astro` (currently only Epsilon has a bespoke page).

To make a product featured (2× card), set `featured: true`. Only one product should be featured at a time.
```

- [ ] **Step 4: Create `docs/ADDING-A-SECTOR-PRESET.md`**

```markdown
# Adding a new particle field preset

The particle flow field reads from `PRESETS` in `src/scripts/motion/particleFlow.ts`. To add a new preset:

1. Pick a name (e.g., `marine`). Add to `PRESETS`:
   \`\`\`ts
   marine: { color1: [0.02, 0.05, 0.10], color2: [0.27, 0.52, 0.58], flowStrength: 0.22, density: 4.0, speed: 0.7 }
   \`\`\`
2. Update the type `Record<string, FlowPreset>` — no change needed if you keep the index signature generic.
3. Call from a section timeline:
   \`\`\`ts
   (window as any).__flow?.setPreset('marine', 1000);
   \`\`\`

Tuning:
- `flowStrength` → how curled the field is (0.0–0.4)
- `density` → how many particles per screen (2–8)
- `speed` → motion rate (0.3–2.0)
- `color1` → background fade
- `color2` → particle color
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: readme, tokens, how to add products and sector presets"
```

---

## Task 23: Final verification + handoff checklist

- [ ] **Step 1: Full test suite**

Run: `npm run test && npm run check && npm run build`
Expected: all pass.

- [ ] **Step 2: Browser matrix manual smoke**

- Safari latest: open each of / · /products · /products/epsilon. No console errors. Animations work.
- Chrome latest: same.
- Firefox latest: same.
- Mobile viewport (DevTools 375px): no horizontal scroll issues, nav hamburger visible, Four Worlds stacks.

- [ ] **Step 3: Reduced-motion end-to-end**

In macOS System Settings → Accessibility → Display → Reduce motion: ON.
Reload all three pages. Expected: every section is reachable, legible, and stable. No pin. No horizontal scroll. Particle canvas absent.

- [ ] **Step 4: Console cleanliness**

Check DevTools console on all three pages. Expected: zero errors, zero warnings (except dev HMR).

- [ ] **Step 5: Update handoff checklist in spec**

Tick off the handoff checklist items in `docs/superpowers/specs/2026-04-20-elysee-redesign-design.md` section 11.3.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: final handoff verification — build, tests, browser matrix, reduced-motion"
git tag v0.1.0-handoff
```

---

## Self-review notes

- **Spec coverage:** Every section of the spec (design system, architecture, homepage acts, products pages, global components, performance, accessibility, content, delivery) maps to at least one task.
- **Type consistency:** `ParticleFlow` setPreset signature matches between `particleFlow.ts` and the callers in `manifesto.ts`, `fourWorlds.ts`, `epsilonCameo.ts`, `counters.ts`, `globalMap.ts`, `epsilonPage.ts`. Preset names (`hero`, `agri`, `landscape`, `building`, `industry`, `counters`, `map`, `epsilon`) are consistent across the test, PRESETS constant, and usage sites.
- **GSAP plugins:** Plan uses only native plugins (ScrollTrigger, Observer, Flip). SplitText and DrawSVG references in the spec are replaced in the plan with native equivalents (word-wrap spans + custom stagger; SVG `stroke-dasharray`/`stroke-dashoffset`). This is a deliberate simplification — a €10k handoff cannot depend on a Club license the client may not have. The README notes how to upgrade if Club is available.
- **Reduced-motion:** Each motion task has an explicit reduced-motion verification step. Task 20 consolidates a full audit.
- **Testing:** Pure-logic utilities (reducedMotion, counter, particleFlow presets, stats) are TDD'd. Visual components are verified via browser + build checks. This is appropriate for an animation-heavy project.

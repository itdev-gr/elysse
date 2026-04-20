# Design Tokens

All tokens live in two places — keep them in sync when editing:

- **`src/styles/tokens.css`** — runtime CSS custom properties (`--token-name`)
- **`src/styles/tailwind.css` `@theme` block** — mirrors the same values so Tailwind utility classes (e.g. `bg-surface-deep`, `text-accent-bright`) are generated

---

## Colors

| Token | Hex | Role |
|---|---|---|
| `--surface-deep` | `#0a1410` | Page canvas (default background) |
| `--surface-relief` | `#0d1f16` | Pinned section lift — subtle depth separation |
| `--surface-break` | `#f2ede3` | One dramatic light inversion (Manifesto act only) |
| `--text-primary` | `#f2ede3` | Body copy on dark canvas |
| `--text-secondary` | `#a8c4b2` | Subdued body copy on dark |
| `--text-mono` | `#7eb08c` | Monospace labels, engineering spec callouts |
| `--accent-bright` | `#aee4be` | Hover states, live/active indicators, emphasis |
| `--accent-primary` | `#7eb08c` | Primary brand green |
| `--accent-deep` | `#3d6b52` | Secondary green, hairline borders |
| `--accent-water` | `#6fb8c2` | Data chips, hover only — use sparingly |
| `--hairline` | `rgba(242, 237, 227, 0.12)` | Dividers and fine borders on dark |

**Contrast ratios:** Body text on dark canvas ≥ 4.5:1. Large display text ≥ 3:1. `--accent-bright` on `--surface-deep` ≥ 7:1.

---

## Typography

| Role | Family | CSS variable | Notes |
|---|---|---|---|
| Display / serif | **Fraunces** (variable: `opsz`, `slnt`, `SOFT`) | `--font-display` | Italic axis animates (0 → -10) on hover emphasis. Weights 100–900 served from one variable font file. |
| Body / UI | **Inter Tight** (variable) | `--font-body` | 400 / 500 / 600 used. |
| Mono / spec | **JetBrains Mono** (variable) | `--font-mono` | 10–12px, `letter-spacing: 0.18em`, uppercase for labels. |

### Display size ramp

| Use case | Size |
|---|---|
| Hero headline | 180px |
| Section titles | 140px |
| E-series act headers | 96px |
| Card titles | 48px |
| Body-adjacent titles | 22px |

All fonts are self-hosted in `public/fonts/`, subset to Latin + Latin-Ext, served as `woff2` with `font-display: swap`. Fraunces 500 and Inter Tight 400 are `<link rel="preload">` in the `<head>`.

---

## Grid & spacing

| Property | Desktop (≥ 1024px) | Tablet (768–1023px) | Mobile (< 768px) |
|---|---|---|---|
| Columns | 12 | 8 | 4 |
| Gutter (`--gutter`) | 24px | 20px | 16px |
| Side margin (`--margin`) | 80px | 48px | 24px |
| Max container (`--container`) | 1440px | — | — |

**Vertical rhythm:** 8px base unit. Section padding: 160px / 96px / 64px (desktop / tablet / mobile).

---

## Easing

| Token | Value | Use |
|---|---|---|
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances — type reveals, element slides in |
| `--ease-in-out-cubic` | `cubic-bezier(0.65, 0, 0.35, 1)` | State transitions — filter shuffles, panel changes |

In GSAP timelines these map to `'expo.out'` and `'power2.inOut'` respectively.

---

## Changing a token

1. Update the value in `src/styles/tokens.css` under `:root { … }`.
2. Update the matching entry in the `@theme { … }` block inside `src/styles/tailwind.css`.
3. Run `npm run dev` — hot reload applies immediately. Run `npm run build && npm run check` before committing.

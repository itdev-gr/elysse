# Adding a product

1. Create `src/content/products/<slug>.mdx` with frontmatter matching the schema in `src/content/config.ts`:

   ```yaml
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
   ```

2. Add the product image to `public/images/products/`.
3. Run `npm run dev` — the card appears at `/products`. The detail page at `/products/<slug>` will 404 until you create a corresponding `src/pages/products/[slug].astro` (currently only Epsilon has a bespoke page).

To make a product featured (2× card), set `featured: true`. Only one product should be featured at a time.

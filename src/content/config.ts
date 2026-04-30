import { defineCollection, z } from 'astro:content';

const products = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    categorySlug: z.enum(['compression-fittings', 'hydraulic-fittings', 'saddles', 'light-weight-fittings', 'valves', 'filters-and-dosers', 'micro-irrigation-and-sprinklers', 'turf', 'polyethylene-pipes', 'pvc-pressure-pipes-and-fittings', 'network-drainage', 'cable-applications', 'building-sewerage']),
    blurb: z.string(),
    pressure: z.string(),
    sizeRange: z.string(),
    featured: z.boolean().default(false),
    image: z.string(),
    specs: z.array(z.object({ key: z.string(), value: z.string() })).default([]),
    bim: z.boolean().default(false),
    datasheet: z.string().optional(),

    // Catalog fields (additive)
    code: z.string().optional(),
    sectors: z.array(z.enum(['agriculture', 'landscape', 'building', 'industry'])).default([]),
    material: z.string().optional(),
    dnRange: z.tuple([z.number(), z.number()]).optional(),
    pnRating: z.number().optional(),
    standards: z.array(z.string()).default([]),
    imageUrls: z.array(z.string()).default([]),
    installation: z.string().optional(),

    availableCountries: z.array(z.enum(['country-1', 'country-2', 'country-3'])).nonempty()
  })
});

const categories = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    slug: z.string().optional(),
    order: z.number().int().nonnegative(),
    image: z.string(),
    sourceImage: z.string().url().optional(),
    leafletPdf: z.string().optional(),
    blurb: z.string()
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

export const collections = { products, sectors, insights, categories };

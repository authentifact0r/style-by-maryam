import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    publishDate: z.coerce.date(),
    description: z.string(),
  }),
});

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    name: z.string(),
    price: z.number(),
    description: z.string(),
    image: z.string().optional(),
    category: z.enum(['evening', 'ready-to-wear', 'accessories']),
    featured: z.boolean().default(false),
    soldOut: z.boolean().default(false),
    publishDate: z.coerce.date(),
  }),
});

export const collections = { pages, products };

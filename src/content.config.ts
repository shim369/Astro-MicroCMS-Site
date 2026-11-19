import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { getArticles } from './lib/microcms'

// microCMS "blogs" as a content collection, fetched once per build.
// `order` keeps microCMS's newest-first order (getCollection doesn't guarantee one).
const blogs = defineCollection({
	loader: async () => (await getArticles()).map((article, order) => ({ ...article, order })),
	schema: z.object({
		order: z.number(),
		title: z.string(),
		content: z.string(),
		publishedAt: z.string(),
		eyecatch: z.object({ url: z.url(), width: z.number().optional(), height: z.number().optional() }).optional(),
		category: z.object({ name: z.string() }).nullish(),
	}),
})

export const collections = { blogs }

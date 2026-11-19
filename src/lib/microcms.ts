import { createClient } from 'microcms-js-sdk'
import { MICROCMS_API_KEY, MICROCMS_SERVICE_DOMAIN } from 'astro:env/server'
import type { Article, ArticleResponse } from '../types/article'

export const microcmsClient = createClient({
	serviceDomain: MICROCMS_SERVICE_DOMAIN,
	apiKey: MICROCMS_API_KEY,
})

export const getArticles = async () => {
	const { contents } = await microcmsClient.get<ArticleResponse>({
		endpoint: 'blogs',
		queries: {
			fields: ['id', 'title', 'content', 'eyecatch', 'category', 'publishedAt'],
			limit: 100,
		},
	})
	return contents
}

export type { Article }

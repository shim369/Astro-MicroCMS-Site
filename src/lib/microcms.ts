import { createClient } from 'microcms-js-sdk'
import type { Article, ArticleResponse } from '../types/article'

export const microcmsClient = createClient({
	serviceDomain: import.meta.env.MICROCMS_SERVICE_DOMAIN,
	apiKey: import.meta.env.MICROCMS_API_KEY,
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

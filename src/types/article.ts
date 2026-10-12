import type { MicroCMSImage } from 'microcms-js-sdk'

export interface Category {
	name: string
}

export interface Article {
	id: string
	createdAt: string
	updatedAt: string
	publishedAt: string
	revisedAt: string
	title: string
	content: string
	eyecatch?: MicroCMSImage
	category: Category
}

export interface ArticleResponse {
	totalCount: number
	offset: number
	limit: number
	contents: Article[]
}

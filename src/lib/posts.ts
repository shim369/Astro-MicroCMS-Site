import { getCollection, type CollectionEntry } from 'astro:content'

export type Post = CollectionEntry<'blogs'>

/** All posts, newest first (same order as microCMS). */
export const getPosts = async (): Promise<Post[]> =>
	(await getCollection('blogs')).sort((a, b) => a.data.order - b.data.order)

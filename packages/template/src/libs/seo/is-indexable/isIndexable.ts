export function isIndexable(indexing: boolean): boolean {
	return indexing && import.meta.env.MODE === 'production'
}

const pattern = /^---\r?\n([\s\S]*?)\r?\n---(?=\r?\n|$)/

export function astroFrontmatter(source: string) {
	const match = pattern.exec(source)
	return match
		? { block: match[0], script: match[1], body: source.slice(match[0].length) }
		: null
}

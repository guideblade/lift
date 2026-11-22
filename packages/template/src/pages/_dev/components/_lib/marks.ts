import type { DocCheck, DocMarks } from '#docs'

const slug = (label: string) =>
	label
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')

export const tagToken = (tag: string) => `#${tag.toLowerCase()}`

export const checkToken = (check: DocCheck) =>
	`${check.done ? 'is' : 'not'}:${slug(check.label)}`

export const tokensOf = (marks: DocMarks) => [
	...marks.tags.map(tagToken),
	...marks.checks.map(checkToken),
]

export const isToken = (word: string) => /^(#|is:|not:)/.test(word)

export function summary(entries: readonly DocMarks[]) {
	const tags = new Map<string, { label: string; count: number }>()
	const checks = new Map<string, { label: string; done: number; total: number }>()
	for (const entry of entries) {
		for (const tag of entry.tags) {
			const key = tagToken(tag)
			const found = tags.get(key) ?? { label: tag, count: 0 }
			tags.set(key, { ...found, count: found.count + 1 })
		}
		for (const check of entry.checks) {
			const key = slug(check.label)
			const found = checks.get(key) ?? { label: check.label, done: 0, total: 0 }
			checks.set(key, {
				...found,
				done: found.done + (check.done ? 1 : 0),
				total: found.total + 1,
			})
		}
	}
	return {
		tags: [...tags].map(([token, item]) => ({ token, ...item })),
		checks: [...checks].map(([key, item]) => ({
			...item,
			doneToken: `is:${key}`,
			openToken: `not:${key}`,
		})),
	}
}

import { existsSync, readFileSync } from 'node:fs'
import type { DocMarks } from './types.ts'

const fenced = /```[\s\S]*?```|~~~[\s\S]*?~~~/g
const inline = /`[^`\n]*`/g
const tag = /(?<=^|\s)#([A-Za-z][\w-]*)/gm
const check = /^\s*[-*+]\s+\[([ xX])\]\s+(.+?)\s*$/gm

export function readmeMarks(path: string | null): DocMarks {
	if (!path || !existsSync(path)) {
		return { tags: [], checks: [] }
	}
	const text = readFileSync(path, 'utf8').replace(fenced, '').replace(inline, '')
	const tags = new Map<string, string>()
	for (const [, name = ''] of text.matchAll(tag)) {
		if (!tags.has(name.toLowerCase())) {
			tags.set(name.toLowerCase(), name)
		}
	}
	return {
		tags: [...tags.values()],
		checks: [...text.matchAll(check)].map(([, mark, label = '']) => ({
			label,
			done: mark !== ' ',
		})),
	}
}

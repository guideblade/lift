import { rel } from '../project.ts'
import { discover, type Item, type Part } from './find.ts'
import type { Kind } from './kinds.ts'

type Problem = { file: string; message: string }

const allowed = ['description', 'metadata']

const problem = (part: Part, message: string): Problem => ({
	file: rel(part.file),
	message,
})

const fields = (part: Part) =>
	part.frontmatterError
		? [problem(part, part.frontmatterError)]
		: Object.keys(part.fields)
				.filter(key => !allowed.includes(key))
				.map(key =>
					problem(
						part,
						`unknown field \`${key}\`; allowed: ${allowed.join(', ')}`,
					),
				)

function itemProblems(item: Item) {
	const roots =
		item.roots.length > 1
			? item.roots.map(part =>
					problem(
						part,
						`one of ${item.roots.length} roots of ${item.name}; move one above the others`,
					),
				)
			: []
	const parts = [...item.roots, ...item.children]
	return [
		...roots,
		...item.roots
			.filter(part => !part.frontmatterError && !part.fields.description)
			.map(part => problem(part, 'a root needs a `description`')),
		...parts.flatMap(fields),
		...parts.filter(part => part.body === '').map(part => problem(part, 'empty')),
	]
}

export function checkKind(kind: Kind) {
	const { items, strays } = discover(kind)
	const loose = strays.map(path => ({
		file: rel(path),
		message: `${kind.folder} holds only folders with a ${kind.file}`,
	}))
	return {
		items: items.length,
		problems: [...loose, ...items.flatMap(itemProblems)],
	}
}

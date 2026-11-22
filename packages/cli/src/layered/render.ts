import { resolve } from 'node:path'
import { fail, rel, root } from '../project.ts'
import { covering, discover, type Item, type Part } from './find.ts'
import type { Kind } from './kinds.ts'

const where = (part: Part) => rel(part.covers) || '.'

function banner(kind: Kind, item: Item, part: Part) {
	const scope =
		kind.topic === 'skills'
			? `piece for ${where(part)}`
			: part === item.root
				? 'root'
				: `child for ${where(part)}`
	return `<!-- ${kind.noun} ${item.name} · ${scope} · ${rel(part.file)} -->`
}

const section = (kind: Kind, item: Item, part: Part) =>
	`${banner(kind, item, part)}\n\n${part.body}`

function map(kind: Kind, item: Item) {
	if (item.children.length === 0) {
		return null
	}
	return [
		`<!-- ${item.children.length} child(ren) of ${item.name}; \`lift ${kind.topic} read ${item.name} <path>\` loads the ones that cover <path> -->`,
		'',
		...item.children.map(part =>
			`- \`${where(part)}\`: ${part.fields.description ?? ''}`.trimEnd(),
		),
	].join('\n')
}

export function listing(kind: Kind) {
	const { items } = discover(kind)
	const width = Math.max(0, ...items.map(item => item.name.length))
	return items.map(item => {
		if (kind.topic === 'skills') {
			return [
				item.name,
				...[...item.roots, ...item.children].map(part =>
					`  ${where(part)}  ${part.fields.description ?? ''}`.trimEnd(),
				),
			].join('\n')
		}
		const children =
			item.children.length > 0 ? `, ${item.children.length} child(ren)` : ''
		return [
			`${item.name.padEnd(width)}  ${item.description}`,
			`${''.padEnd(width)}  ${rel(item.root.file)}${children}`,
		].join('\n')
	})
}

export function named(kind: Kind, name: string) {
	const { items } = discover(kind)
	const found = items.find(item => item.name === name)
	if (!found) {
		const known = items.map(item => item.name).join(', ') || 'none'
		return fail(`no ${kind.noun} named ${name}; known: ${known}`)
	}
	if (kind.topic !== 'skills' && found.roots.length > 1) {
		return fail(
			`${name} has ${found.roots.length} roots (${found.roots.map(part => rel(part.file)).join(', ')}); run \`lift ${kind.topic} check\``,
		)
	}
	return found
}

export function readItem(kind: Kind, item: Item, paths: string[]) {
	if (kind.topic === 'skills') {
		const parts = [...item.roots, ...item.children]
		if (paths.length === 0) {
			return [
				`Available scopes for ${item.name}. Pass a path to read the pieces that apply there.`,
				...parts.map(part =>
					`- \`${where(part)}\`: ${part.fields.description ?? ''}`.trimEnd(),
				),
			].join('\n')
		}
		const applicable = covering(
			parts,
			paths.map(path => resolve(root(), path)),
		)
		return applicable.length
			? applicable.map(part => section(kind, item, part)).join('\n\n')
			: `<!-- skill ${item.name} does not cover ${paths.join(', ')} -->`
	}
	if (paths.length === 0) {
		return [section(kind, item, item.root), map(kind, item)]
			.filter(Boolean)
			.join('\n\n')
	}
	const resolved = paths.map(path => resolve(root(), path))
	if (covering([item.root], resolved).length === 0) {
		return `<!-- ${kind.noun} ${item.name} is for ${where(item.root)} and the folders inside it; it does not cover ${paths.join(', ')} -->`
	}
	const children = covering(item.children, resolved)
	const note =
		children.length === 0
			? `<!-- no child of ${item.name} covers ${paths.join(', ')} -->`
			: null
	return [item.root, ...children]
		.map(part => section(kind, item, part))
		.concat(note ?? [])
		.join('\n\n')
}

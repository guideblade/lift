import { type Dirent, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
	groupFor,
	groupPrefix,
	isGroup,
	isKebab,
} from '@/components/_conventions/names.ts'
import { toPascal } from '@/_commands/lib/names.ts'

export type Entry = Lift.Choice & {
	name: string
	pascal: string
	group: string
	dir: string
}

const directories = (dir: string): Dirent[] =>
	existsSync(dir)
		? readdirSync(dir, { withFileTypes: true }).filter(entry => entry.isDirectory())
		: []

const groupIn = (dir: string, prefix: string, name: string) =>
	groupFor(
		prefix,
		directories(dir).map(entry => entry.name),
		name,
	)

export function placeIn(root: string, name: string) {
	let dir = root
	let prefix = ''
	let group = groupIn(dir, prefix, name)
	while (group) {
		dir = join(dir, group)
		prefix = groupPrefix(prefix, group)
		group = groupIn(dir, prefix, name)
	}
	return join(dir, name)
}

const entry = (dir: string, name: string, group: string): Entry => ({
	name,
	pascal: toPascal(name),
	group,
	dir,
	label: group ? `${name} (${group})` : name,
	search: [name, `${name} ${group}`, toPascal(name)],
})

export function entriesIn(root: string, group = ''): Entry[] {
	return directories(root)
		.flatMap(item => {
			const dir = join(root, item.name)
			if (!isGroup(item.name) && !isKebab(item.name)) {
				return []
			}
			return existsSync(join(dir, 'ui'))
				? [entry(dir, item.name, group)]
				: entriesIn(dir, group ? `${group}/${item.name}` : item.name)
		})
		.sort((a, b) => a.name.localeCompare(b.name))
}

export function find<T extends Entry>(entries: readonly T[], target: string | undefined) {
	const wanted = target
		?.replace(/^@(primitives|blocks|widgets|presets)\//, '')
		.toLowerCase()
	return wanted
		? entries.find(item =>
				[item.name, `${item.name} ${item.group}`, item.pascal].some(
					value => value.toLowerCase() === wanted,
				),
			)
		: undefined
}

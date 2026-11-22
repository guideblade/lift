import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import type { DefaultTheme } from 'vitepress'
import { byDepth, contains, isTop, kinds, levelOf } from './theme/levels.ts'

type Found = NonNullable<ReturnType<typeof levelOf>> & { file: string }

const skipped = (name: string) =>
	name.startsWith('.') || name === 'node_modules' || name === 'dist'

const heading = /^# (.+)$/m

function scan(dir: string, root: string): Found[] {
	return readdirSync(dir, { withFileTypes: true })
		.filter(entry => entry.isDirectory() && !skipped(entry.name))
		.flatMap(entry => {
			const path = join(dir, entry.name)
			const kind = kinds.find(known => known.folder === entry.name)
			if (!kind) {
				return scan(path, root)
			}
			return readdirSync(path, { withFileTypes: true })
				.filter(item => item.isDirectory())
				.map(item => join(path, item.name, kind.file))
				.filter(file => existsSync(file))
				.flatMap(file => {
					const found = levelOf(relative(root, file).split(sep).join('/'))
					return found ? [{ ...found, file }] : []
				})
		})
}

export const levelFiles = (root: string) => scan(root, root).map(found => found.file)

const titleOf = (found: Found) =>
	readFileSync(found.file, 'utf8').match(heading)?.[1].trim() ?? found.name

export function levelGroups(root: string, folder: string): DefaultTheme.SidebarItem[] {
	const found = scan(join(root, folder), root)
	return kinds
		.map(kind => ({
			text: kind.label,
			collapsed: true,
			items: found
				.filter(level => level.kind === kind.kind && isTop(level, found))
				.filter(level => contains(folder, level.folder))
				.sort(byDepth)
				.map(level => ({
					text: titleOf(level),
					link: `/${level.folder ? `${level.folder}/` : ''}${kind.folder}/${level.name}/${kind.file.replace(/\.md$/, '')}`,
				})),
		}))
		.filter(group => group.items.length > 0)
}

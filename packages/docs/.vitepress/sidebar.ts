import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join, relative, sep } from 'node:path'
import type { DefaultTheme } from 'vitepress'
import { levelGroups } from './levels.ts'

type Folder = { name: string; path: string; readme: boolean; children: Folder[] }

const README = 'README.md'
const skipped = new Set(['node_modules', 'dist'])
const heading = /^# (.+)/

const toPosix = (path: string) => path.split(sep).join('/')
const sortKey = (folder: Folder) => folder.name.replace(/[()]/g, '')

function scan(dir: string, root: string): Folder {
	const children = readdirSync(dir, { withFileTypes: true })
		.filter(
			entry =>
				entry.isDirectory() &&
				!entry.name.startsWith('.') &&
				!skipped.has(entry.name),
		)
		.map(entry => scan(join(dir, entry.name), root))
		.filter(folder => folder.readme || folder.children.length > 0)
		.sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
	return {
		name: basename(dir),
		path: toPosix(relative(root, dir)),
		readme: existsSync(join(dir, README)),
		children,
	}
}

function compact(folder: Folder): Folder {
	const children = folder.children.map(compact)
	const [only] = children
	if (!folder.readme && children.length === 1) {
		return { ...only, name: `${folder.name}/${only.name}` }
	}
	return { ...folder, children }
}

function titleOf(root: string, folder: Folder) {
	const text = readFileSync(join(root, folder.path, README), 'utf8')
	return text.match(heading)?.[1].trim() ?? folder.name
}

function itemOf(root: string, folder: Folder): DefaultTheme.SidebarItem {
	const items = folder.children.map(child => itemOf(root, child))
	const item = folder.readme
		? { text: titleOf(root, folder), link: `/${folder.path}/README` }
		: { text: folder.name }
	return items.length > 0 ? { ...item, items, collapsed: true } : item
}

export function sidebar(root: string): DefaultTheme.SidebarItem[] {
	return scan(join(root, 'packages'), root).children.map(folder => {
		const item = itemOf(root, compact(folder))
		return {
			...item,
			items: [...(item.items ?? []), ...levelGroups(root, folder.path)],
		}
	})
}

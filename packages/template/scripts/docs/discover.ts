import { existsSync, readdirSync, readFileSync } from 'node:fs'
import {
	instanceFiles,
	isGroup,
	rootFolders,
} from '../../src/components/_conventions/names.ts'
import type { DocsOptions } from './types.ts'
import { basename, join, relative, resolve, sep } from 'node:path'
import { astroFrontmatter } from '../astro/frontmatter.ts'

export type Found = {
	id: string
	title: string
	layer: string
	full: boolean
	group: string[]
	astro: string
	frontmatter: string
	slots: string[]
	samples: string | null
	readme: string | null
	instance: string | null
	manager: string | null
}

const reexport = /export\s*\{\s*default\s*\}\s*from\s*['"](\.[^'"]+\.astro)['"]/
const documentRoot = /^(?:\s|<!--[\s\S]*?-->)*<(html|head|body)[\s>]/
const slotTag = /<slot\b([^>]*)>/g
const slotName = /\bname=["']([^"']+)["']/
const skipped = (name: string) =>
	name.startsWith('_') || name === 'node_modules' || rootFolders.includes(name)

const toPosix = (path: string) => path.split(sep).join('/')
const optional = (path: string) => (existsSync(path) ? toPosix(path) : null)

function folders(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true })
		.filter(entry => entry.isDirectory() && !skipped(entry.name))
		.flatMap(entry => {
			const path = join(dir, entry.name)
			return [path, ...folders(path)]
		})
}

function instancesOf(dir: string, pascal: string) {
	const [instance, manager] = instanceFiles(pascal).map(file =>
		optional(join(dir, file)),
	)
	return { instance, manager }
}

function slotsOf(template: string) {
	const names = [...template.matchAll(slotTag)].map(
		([, attributes]) => attributes.match(slotName)?.[1] ?? 'default',
	)
	return [...new Set(names)]
}

function entryOf(dir: string) {
	const index = join(dir, 'index.ts')
	const target = existsSync(index)
		? readFileSync(index, 'utf8').match(reexport)?.[1]
		: null
	const astro = target ? resolve(dir, target) : null
	return astro && existsSync(astro)
		? { astro, source: readFileSync(astro, 'utf8') }
		: null
}

function inspect(layer: string, full: boolean, root: string, dir: string): Found | null {
	const entry = entryOf(dir)
	const frontmatter = entry && astroFrontmatter(entry.source)
	const template = frontmatter?.body ?? entry?.source ?? ''
	if (!entry || documentRoot.test(template)) {
		return null
	}
	const { astro } = entry
	const segments = relative(root, dir).split(sep)
	const path = segments.filter(segment => !isGroup(segment))
	return {
		id: [layer, ...path].join('/'),
		title: basename(astro, '.astro'),
		layer,
		full,
		group: segments.slice(0, -1).map(segment => segment.replace(/^\((.+)\)$/, '$1')),
		astro: toPosix(astro),
		frontmatter: frontmatter?.script ?? '',
		slots: slotsOf(template),
		samples: optional(join(dir, 'samples', 'index.ts')),
		readme: optional(join(dir, 'README.md')),
		...instancesOf(dir, basename(astro, '.astro')),
	}
}

export function discover(base: string, roots: DocsOptions['roots']): Found[] {
	return Object.entries(roots)
		.flatMap(([layer, { path, full }]) => {
			const root = resolve(base, path)
			return existsSync(root)
				? folders(root).map(dir => inspect(layer, full, root, dir))
				: []
		})
		.filter(found => found !== null)
		.sort((a, b) => a.id.localeCompare(b.id))
}

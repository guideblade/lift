import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isMap, isScalar, parseDocument } from 'yaml'
import { isWithin, root } from '../project.ts'
import type { Kind } from './kinds.ts'

export type Part = {
	name: string
	file: string
	covers: string
	fields: Record<string, string>
	frontmatterError?: string
	body: string
}

export type Item = {
	name: string
	description: string
	root: Part
	roots: Part[]
	children: Part[]
}

export type Found = { items: Item[]; strays: string[]; folders: string[] }

const skipped = (name: string) =>
	name.startsWith('.') || name === 'node_modules' || name === 'dist'

const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/

function parse(kind: Kind, source: string) {
	const match = source.match(frontmatter)
	if (!match) {
		return { fields: {}, body: source.trim() }
	}
	const document = parseDocument(match[1])
	const body = source.slice(match[0].length).trim()
	if (kind.topic === 'skills') {
		const description: unknown = isMap(document.contents)
			? document.get('description')
			: undefined
		return {
			fields: {
				description: typeof description === 'string' ? description.trim() : '',
			},
			body,
		}
	}
	if (document.errors.length > 0 || !isMap(document.contents)) {
		return {
			fields: {},
			body,
			frontmatterError: 'frontmatter must be a valid YAML map',
		}
	}
	return {
		fields: Object.fromEntries(
			document.contents.items.map(({ key, value }) => [
				String(key),
				isScalar(value) && typeof value.value === 'string'
					? value.value.trim()
					: '',
			]),
		),
		body,
	}
}

type Scan = { parts: Part[]; strays: string[]; folders: string[] }

function read(kind: Kind, dir: string): Scan {
	const entries = readdirSync(dir, { withFileTypes: true }).filter(
		entry => kind.topic !== 'skills' || entry.name !== '_conventions',
	)
	const folders = entries.filter(entry => entry.isDirectory())
	const found = folders.filter(entry =>
		statSync(join(dir, entry.name, kind.file), { throwIfNoEntry: false })?.isFile(),
	)
	return {
		folders: [dir],
		parts: found.map(entry => {
			const file = join(dir, entry.name, kind.file)
			return {
				name: entry.name,
				file,
				covers: join(dir, '..'),
				...parse(kind, readFileSync(file, 'utf8')),
			}
		}),
		strays: entries
			.filter(entry => !found.includes(entry))
			.map(entry => join(dir, entry.name)),
	}
}

function walk(kind: Kind, dir: string): Scan {
	const scans = readdirSync(dir, { withFileTypes: true })
		.filter(entry => entry.isDirectory() && !skipped(entry.name))
		.map(entry => {
			const path = join(dir, entry.name)
			return entry.name === kind.folder ? read(kind, path) : walk(kind, path)
		})
	return {
		folders: scans.flatMap(scan => scan.folders),
		parts: scans.flatMap(scan => scan.parts),
		strays: scans.flatMap(scan => scan.strays),
	}
}

const depth = (part: Part) => part.covers.split(/[\\/]/).length

const byDepth = (a: Part, b: Part) => depth(a) - depth(b) || a.file.localeCompare(b.file)

const isRoot = (part: Part, all: Part[]) =>
	!all.some(
		other =>
			other !== part &&
			other.covers !== part.covers &&
			isWithin(part.covers, other.covers),
	)

function assemble(name: string, parts: Part[]): Item {
	const roots = parts.filter(part => isRoot(part, parts))
	const [first] = roots
	return {
		name,
		description: first.fields.description ?? '',
		root: first,
		roots,
		children: parts.filter(part => !roots.includes(part)),
	}
}

export function discover(kind: Kind): Found {
	const { parts, strays, folders } = walk(kind, root())
	const groups = Map.groupBy(parts.sort(byDepth), part => part.name)
	return {
		items: [...groups]
			.map(([name, group]) => assemble(name, group))
			.sort((a, b) => a.name.localeCompare(b.name)),
		strays,
		folders,
	}
}

export const covering = (parts: Part[], paths: string[]) =>
	parts.filter(part => paths.some(path => isWithin(path, part.covers)))

import { existsSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import type {
	ExportAllDeclaration,
	ExportNamedDeclaration,
	ImportDeclaration,
	ImportExpression,
} from 'oxc-parser'
import { lift } from './lift.ts'
import { blueprintsFolder, conventionsFolder } from './names.ts'
import { localFiles } from './owner.ts'

type Sourced =
	| ImportDeclaration
	| ExportNamedDeclaration
	| ExportAllDeclaration
	| ImportExpression

type Found = { file: string; value: string; line: number }

const sourcedTypes: Sourced['type'][] = [
	'ImportDeclaration',
	'ExportNamedDeclaration',
	'ExportAllDeclaration',
	'ImportExpression',
]

export const project = join(import.meta.dirname, '../..')
export const src = join(project, 'src')

type Alias = { key: string; dir: string; exact: boolean }

const paths = (
	JSON.parse(readFileSync(join(project, 'tsconfig.json'), 'utf8')) as {
		compilerOptions: { paths: Record<string, string[]> }
	}
).compilerOptions.paths

const aliases: Alias[] = Object.entries(paths)
	.map(([key, [target = '']]) => ({
		key: key.replace(/\*$/, ''),
		dir: join(project, target.replace(/\*$/, '')),
		exact: !key.endsWith('*'),
	}))
	.sort((a, b) => b.key.length - a.key.length)

const scriptFile = /\.(ts|js|mts|mjs)$/
const vueScript = /(<script\b[^>]*>)([\s\S]*?)<\/script>/g
const styleUse = /@(?:use|forward|import)\s+['"]([^'"]+)['"]/g

const blank = (text: string) => text.replace(/[^\n]/g, ' ')
export function isWithin(dir: string, path: string) {
	const rel = relative(dir, path)
	return !rel.startsWith('..') && !isAbsolute(rel)
}

function vueScripts(scope: Lift.Scope, file: string) {
	const source = scope.read(file)
	if (source === null) {
		return []
	}
	let masked = ''
	let at = 0
	for (const match of source.matchAll(vueScript)) {
		const [, open = '', body = ''] = match
		const start = match.index + open.length
		masked += blank(source.slice(at, start)) + body
		at = start + body.length
	}
	return [new lift.Script(scope.path(file), masked + blank(source.slice(at)))]
}

function scriptsOf(scope: Lift.Scope, file: string): Lift.Script[] {
	if (file.endsWith('.astro')) {
		const astro = scope.astro(file)
		return astro
			? [
					...(astro.frontmatter ? [astro.frontmatter] : []),
					...astro.elements('script').map(node => astro.script(node)),
				]
			: []
	}
	if (file.endsWith('.vue')) {
		return vueScripts(scope, file)
	}
	const script = scriptFile.test(file) ? scope.ts(file) : null
	return script ? [script] : []
}

function specifiers(script: Lift.Script): Found[] {
	return sourcedTypes
		.flatMap(type => script.find<Sourced>(type))
		.flatMap(({ source }) =>
			source?.type === 'Literal' && typeof source.value === 'string'
				? [{ file: script.file, value: source.value, line: script.line(source) }]
				: [],
		)
}

const usesIn = (file: string, text: string, firstLine: number): Found[] =>
	[...text.matchAll(styleUse)].map(match => ({
		file,
		value: match[1] ?? '',
		line: firstLine + text.slice(0, match.index).split('\n').length - 1,
	}))

function stylesOf(scope: Lift.Scope, file: string): Found[] {
	const path = scope.path(file)
	if (file.endsWith('.scss')) {
		return usesIn(path, scope.read(file) ?? '', 1)
	}
	if (!file.endsWith('.astro')) {
		return []
	}
	const astro = scope.astro(file)
	return (astro?.elements('style') ?? []).flatMap(node => {
		const { value, line } = astro?.content(node) ?? { value: '', line: 1 }
		return usesIn(path, value, line)
	})
}

export const importsOf = (scope: Lift.Scope) =>
	localFiles(scope, /\.(astro|vue|scss|ts|js|mts|mjs)$/)
		.filter(file => scope.inFocus(scope.path(file)))
		.flatMap(file => [
			...scriptsOf(scope, file).flatMap(specifiers),
			...stylesOf(scope, file),
		])

export function targetOf(file: string, specifier: string) {
	if (specifier.startsWith('.')) {
		return resolve(dirname(file), specifier)
	}
	const alias = aliases.find(({ key, exact }) =>
		exact ? specifier === key : specifier.startsWith(key),
	)
	return alias
		? join(alias.dir, alias.exact ? '' : specifier.slice(alias.key.length))
		: null
}

export function layerOf(path: string) {
	for (let dir = path; dir !== src && isWithin(src, dir); dir = dirname(dir)) {
		if (existsSync(join(dir, conventionsFolder, 'layer.ts'))) {
			return relative(src, dir).split(sep).join('/')
		}
	}
}

export function blueprintOf(path: string) {
	const parts = path.split(sep)
	const at = parts.lastIndexOf(blueprintsFolder)
	return at === -1 ? null : parts.slice(0, at + 3).join(sep)
}

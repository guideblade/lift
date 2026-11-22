import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { blueprintsFolder } from '@/_conventions/names.ts'
import { blueprintName } from '@/components/_conventions/names.ts'
import { toCamel, toKebab, toPascal } from './names.ts'

export type Names = { pascal: string; kebab: string }

type Edit = (text: string, file: string) => string

const blueprintPascal = toPascal(blueprintName)

export function findBlueprint(kindDir: string, variant: string) {
	const dir = join(kindDir, blueprintsFolder, variant, blueprintName)
	return existsSync(dir) ? dir : null
}

const filesIn = (dir: string, base = dir): string[] =>
	readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
		const full = join(dir, entry.name)
		return entry.isDirectory()
			? filesIn(full, base)
			: [relative(base, full).split(sep).join('/')]
	})

const renameStem = (stem: string, names: Names) => {
	if (stem === blueprintName) {
		return names.kebab
	}
	return stem.endsWith(blueprintPascal)
		? stem.slice(0, -blueprintPascal.length) + names.pascal
		: stem
}

const renamePart = (part: string, names: Names) => {
	const dot = part.indexOf('.')
	return dot === -1
		? renameStem(part, names)
		: renameStem(part.slice(0, dot), names) + part.slice(dot)
}

const renamePath = (path: string, names: Names) =>
	path
		.split('/')
		.map(part => renamePart(part, names))
		.join('/')

const stemOf = (file: string) => (file.split('/').at(-1) ?? '').split('.')[0] ?? ''

const identifiersOf = (files: readonly string[]) =>
	files
		.filter(file => file.endsWith('.ts'))
		.map(stemOf)
		.filter(stem => stem !== blueprintPascal && stem.endsWith(blueprintPascal))

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const resetReview = (text: string) =>
	text.replace(/^(\s*reviewed:\s*)\d{4}-\d{2}-\d{2}(\s*)$/m, '$1null$2')

function rename(
	text: string,
	file: string,
	names: Names,
	identifiers: readonly string[],
) {
	let next = text.replace(
		/(['"])(\.\.?\/[^'"]*)\1/g,
		(_, quote: string, path: string) => quote + renamePath(path, names) + quote,
	)
	for (const identifier of identifiers) {
		next = next.replace(
			new RegExp(`\\b${escape(identifier)}\\b`, 'g'),
			renameStem(identifier, names),
		)
	}
	return file === 'README.md'
		? resetReview(next).replace(/^# .+$/m, `# ${names.pascal}`)
		: next
}

export async function copyBlueprint(
	context: Lift.CommandContext,
	options: { from: string; to: string; names: Names; edits?: Edit[] },
) {
	const files = filesIn(options.from)
	const identifiers = identifiersOf(files)
	for (const file of files) {
		const text = rename(
			readFileSync(join(options.from, file), 'utf8'),
			file,
			options.names,
			identifiers,
		)
		const edited = (options.edits ?? []).reduce(
			(current, edit) => edit(current, file),
			text,
		)
		await context.files.create(
			join(options.to, renamePath(file, options.names)),
			edited,
		)
	}
}

export const onlyFolder = (dir: string) => {
	const [name] = existsSync(dir)
		? readdirSync(dir, { withFileTypes: true }).filter(entry => entry.isDirectory())
		: []
	return name ? join(dir, name.name) : null
}

export const onlyBlueprint = (kindDir: string, variant: string) =>
	onlyFolder(join(kindDir, blueprintsFolder, variant))

export const namesOf = (input: string) => ({
	pascal: toPascal(input),
	camel: toCamel(input),
	kebab: toKebab(input),
})

export async function copyTokens(
	context: Lift.CommandContext,
	options: {
		from: string
		to: string
		names: Names & { camel: string }
		only?: (file: string) => boolean
	},
) {
	const source = options.from.split(sep).at(-1) ?? ''
	const tokens: [string, string][] = [
		[toPascal(source), options.names.pascal],
		[toCamel(source), options.names.camel],
		[source, options.names.kebab],
	]
	const swap = (text: string) =>
		tokens.reduce((current, [from, to]) => current.split(from).join(to), text)
	for (const file of filesIn(options.from).filter(options.only ?? (() => true))) {
		const text = swap(readFileSync(join(options.from, file), 'utf8'))
		await context.files.create(
			join(options.to, swap(file)),
			file === 'README.md' ? resetReview(text) : text,
		)
	}
}

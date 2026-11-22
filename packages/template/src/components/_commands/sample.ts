import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { entriesIn, find } from './lib/place.ts'
import { posix, toKebab, toPascal } from '@/_commands/lib/names.ts'

async function createSample(context: Lift.CommandContext) {
	const { formatCode } = await import('@/_commands/lib/format.ts')
	const entries = ['primitives', 'blocks', 'widgets'].flatMap(kind =>
		entriesIn(join(context.root, 'src/components', kind)),
	)
	const target = find(entries, context.args.component)
	if (!target) {
		return context.fail(`Component not found: ${context.args.component ?? ''}`)
	}
	const name = toKebab(context.args.name ?? '')
	if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
		return context.fail('Sample name must start with a letter.')
	}
	const from = toKebab(String(context.flags.from ?? 'primary'))
	const samples = join(target.dir, 'samples')
	const source = join(samples, from)
	const destination = join(samples, name)
	if (!existsSync(join(source, 'index.ts'))) {
		return context.fail(`Source sample not found: ${from}`)
	}
	if (existsSync(destination)) {
		return context.fail(`Sample already exists: ${name}`)
	}
	const index = join(samples, 'index.ts')
	const next = await formatCode(
		context,
		index,
		await registration(context, index, name),
	)
	await copySample(context, source, destination)
	await context.files.update(index, () => next)
	context.log(
		`Created ${posix(context.root, destination)} from ${from} and registered it`,
	)
}

async function copySample(
	context: Lift.CommandContext,
	source: string,
	destination: string,
) {
	const conventions = join('_conventions', 'index.ts')
	const sourceConventions = join(source, conventions)
	if (!existsSync(sourceConventions)) {
		return context.fail(
			`Source sample has no conventions: ${posix(context.root, source)}`,
		)
	}
	for (const file of readdirSync(source, { withFileTypes: true })) {
		if (file.isDirectory() && file.name === '_conventions') {
			continue
		}
		if (!file.isFile()) {
			return context.fail(`A sample may only contain files: ${source}`)
		}
		await context.files.create(
			join(destination, file.name),
			readFileSync(join(source, file.name), 'utf8'),
		)
	}
	await context.files.copy(sourceConventions, join(destination, conventions))
}

async function registration(context: Lift.CommandContext, index: string, name: string) {
	const { parseSync } = await import('oxc-parser')
	const text = readFileSync(index, 'utf8')
	const parsed = parseSync(index, text)
	const declarations = parsed.program.body.flatMap(node =>
		node.type === 'ExportNamedDeclaration' &&
		node.declaration?.type === 'VariableDeclaration'
			? node.declaration.declarations
			: [],
	)
	const exported = declarations.find(
		node => node.id.type === 'Identifier' && node.id.name === 'samples',
	)
	const object = exported?.init
	if (parsed.errors.length || object?.type !== 'ObjectExpression') {
		return context.fail('samples/index.ts needs an exported samples object.')
	}
	const local = `sample${toPascal(name)}`
	if (new RegExp(`\\b${local}\\b`).test(text)) {
		return context.fail(`samples/index.ts already uses ${local}.`)
	}
	const before = text.slice(0, object.end - 1).trimEnd()
	const separator = object.properties.length && !before.endsWith(',') ? ',' : ''
	return `import { sample as ${local} } from './${name}'\n${before}${separator}\n\t'${name}': ${local},\n${text.slice(object.end - 1)}`
}

export default {
	summary: 'Copy and register a component sample',
	examples: ['label secondary', 'label compact --from secondary'],
	args: [
		{ name: 'component', description: 'primitive, block or widget', required: true },
		{ name: 'name', description: 'sample name', required: true },
	],
	flags: [
		{
			name: 'from',
			description: 'sample to copy (default: primary)',
			type: 'string',
		},
	],
	run: createSample,
} satisfies Lift.Command

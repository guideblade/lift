import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { blueprintName } from '@/components/_conventions/names.ts'
import { copyBlueprint, findBlueprint } from '@/_commands/lib/blueprint.ts'
import { posix, toKebab, toPascal } from '@/_commands/lib/names.ts'
import { type Entry, entriesIn, find, placeIn } from '@/components/_commands/lib/place.ts'

type Target = Entry & { alias: string }

type Wrapped = { tag: string; source: string }

const importPath = (target: Target) =>
	[target.alias, ...(target.group ? [target.group] : []), target.name].join('/')

const targets = (root: string): Target[] =>
	[
		...entriesIn(join(root, 'src/components/blocks')).map(item => ({
			...item,
			alias: '@blocks',
		})),
		...entriesIn(join(root, 'src/components/primitives')).map(item => ({
			...item,
			alias: '@primitives',
			label: `${item.name} (primitives${item.group ? `/${item.group}` : ''})`,
		})),
	].sort((a, b) => a.name.localeCompare(b.name))

function wrappedBy(from: string): Wrapped | null {
	const astro = readFileSync(
		join(from, 'ui', `${toPascal(blueprintName)}.astro`),
		'utf8',
	)
	const tag = astro
		.split('---')
		.slice(2)
		.join('---')
		.match(/<([A-Z][A-Za-z0-9]*)/)?.[1]
	const source = tag && astro.match(new RegExp(`import ${tag} from '([^']+)'`))?.[1]
	return tag && source ? { tag, source } : null
}

const swap = (wrapped: Wrapped, target: Target) => (text: string) =>
	text
		.split(`'${wrapped.source}'`)
		.join(`'${importPath(target)}'`)
		.replace(new RegExp(`\\b${wrapped.tag}\\b`, 'g'), target.pascal)

async function createPreset(context: Lift.CommandContext) {
	const pascal = toPascal(context.args.name ?? (await context.ask('Preset name:')))
	if (!pascal) {
		return context.fail('Preset name must contain at least one letter or number.')
	}
	const presets = join(context.root, 'src/components/presets')
	const dir = placeIn(presets, toKebab(pascal))
	if (existsSync(dir)) {
		return context.fail(`A preset named ${pascal} already exists at ${dir}`)
	}
	const from = findBlueprint(presets, 'plain')
	const wrapped = from && wrappedBy(from)
	if (!from || !wrapped) {
		return context.fail(
			'No preset blueprint wrapping a block or primitive in src/components/presets',
		)
	}
	const components = targets(context.root)
	const target =
		find(components, context.args.target) ??
		(await context.pick(
			components,
			'Select a block or primitive to wrap',
			chosen => `Wrapped: ${chosen.pascal} (${importPath(chosen)})`,
		))
	await copyBlueprint(context, {
		from,
		to: dir,
		names: { pascal, kebab: toKebab(pascal) },
		edits: [swap(wrapped, target)],
	})
	context.log(`Created ${posix(context.root, dir)} from ${posix(context.root, from)}`)
}

export default {
	summary: 'Create a preset that wraps a block',
	description:
		'Puts it in the group its name belongs to. Asks for whatever is not given.',
	examples: ['', 'PrimaryCta button'],
	args: [
		{ name: 'name', description: 'PresetName' },
		{ name: 'target', description: 'block to wrap' },
	],
	run: createPreset,
} satisfies Lift.Command

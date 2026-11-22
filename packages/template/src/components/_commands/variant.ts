import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { posix, toKebab } from '@/_commands/lib/names.ts'
import { type Entry, entriesIn, find } from './lib/place.ts'

const tools = "@use '@styles/tools.scss' as *;\n"

type Strategy = {
	template: string
	apply(context: Lift.CommandContext, target: Entry, variant: string): Promise<void>
}

const byPrimaryFirst = (a: string, b: string) =>
	a === 'primary' ? -1 : b === 'primary' ? 1 : a.localeCompare(b)

const variantNames = (target: Entry) =>
	readdirSync(join(target.dir, 'ui/variant'), { withFileTypes: true })
		.filter(entry => entry.isFile() && entry.name.endsWith('.scss'))
		.map(entry => entry.name.replace(/\.scss$/, ''))
		.sort(byPrimaryFirst)

function insertImports(scss: string, importLines: string) {
	const variantImports = /(?:@use\s+['"]\.\/variant\/[^'"]+['"];\s*\r?\n?)+/
	if (variantImports.test(scss)) {
		return scss.replace(variantImports, `${importLines}\n\n`)
	}
	const shared = /(@use\s+['"]\.\/shared['"];?\r?\n)/
	if (shared.test(scss)) {
		return scss.replace(shared, `$1${importLines}\n`)
	}
	const toolsUse = /(@use\s+['"]@styles\/tools\.scss['"][^;]*;\r?\n)/
	if (toolsUse.test(scss)) {
		return scss.replace(toolsUse, `$1${importLines}\n`)
	}
	return `${importLines}\n\n${scss}`
}

function updateScss(names: string[], scss: string) {
	const importLines = names.map(name => `@use './variant/${name}';`).join('\n')
	const entries = names
		.map(name => `\t${name}: meta.module-mixins('${name}'),`)
		.join('\n')
	const next = insertImports(scss, importLines)
	const variantsMap = /\$variants:\s*\([\s\S]*?\);/
	return variantsMap.test(next)
		? next.replace(variantsMap, `$variants: (\n${entries}\n);`)
		: next
}

function updateAstro(variant: string, astro: string) {
	const variantProp = /(variant\?:\s*)(['"][^'"]+['"](?:\s*\|\s*['"][^'"]+['"])*)/
	const match = astro.match(variantProp)
	if (match) {
		const types = match[2]
		return types.includes(`'${variant}'`) || types.includes(`"${variant}"`)
			? astro
			: astro.replace(variantProp, `$1${types} | '${variant}'`)
	}
	const props = /(type\s+Props\s*=\s*BaseProps\s*&\s*\{)([\s\S]*?)(\})/
	return props.test(astro)
		? astro.replace(props, `$1\n\tvariant?: '${variant}'$2$3`)
		: astro
}

const standard: Strategy = {
	template: tools,
	async apply(context, target, variant) {
		await context.files.update(join(target.dir, `ui/${target.name}.scss`), scss =>
			updateScss(variantNames(target), scss),
		)
		await context.files.update(join(target.dir, `ui/${target.pascal}.astro`), astro =>
			updateAstro(variant, astro),
		)
	},
}

const text: Strategy = {
	template: [
		"@use '@styles/tools.scss' as *;",
		"@use '../mixins' as *;",
		'',
		...['small', 'medium', 'large'].flatMap(phase => [
			`@mixin ${phase}($self) {`,
			'\t@include degree(100, $size: 16px);',
			'}',
			'',
		]),
	].join('\n'),
	async apply(context) {
		const { generators, sync } = await import('@/_commands/lib/sync.ts')
		await sync(context, generators.text)
	},
}

const strategies: Record<string, Strategy> = { text }

const targets = (root: string) =>
	[
		...entriesIn(join(root, 'src/components/primitives')).map(item => ({
			...item,
			label: `${item.name} (primitives${item.group ? `/${item.group}` : ''})`,
		})),
		...entriesIn(join(root, 'src/components/blocks')),
		...entriesIn(join(root, 'src/components/widgets')).map(item => ({
			...item,
			label: `${item.name} (widgets${item.group ? `/${item.group}` : ''})`,
		})),
	].sort((a, b) => a.name.localeCompare(b.name))

async function resolveInputs(context: Lift.CommandContext) {
	const { component, variant } = context.args
	const all = targets(context.root)
	const found = find(all, component)
	if (found) {
		return { target: found, input: variant }
	}
	const target = await context.pick(
		all,
		'Select a primitive, block or widget to add a variant to',
		chosen => `Selected: ${chosen.pascal} (${chosen.group || chosen.name})`,
	)
	return { target, input: component && !variant ? component : variant }
}

async function createVariant(context: Lift.CommandContext) {
	const { target, input } = await resolveInputs(context)
	const variant = toKebab(input ?? (await context.ask('Variant name:')))
	if (!variant) {
		return context.fail('Variant name must contain at least one letter or number.')
	}
	const strategy = strategies[target.name] ?? standard
	const file = await context.files.create(
		join(target.dir, `ui/variant/${variant}.scss`),
		strategy.template,
	)
	await strategy.apply(context, target, variant)
	context.log(
		`Added variant ${variant} to ${target.pascal} (${posix(context.root, file)})`,
	)
}

export default {
	summary: 'Add a variant to a primitive, block or widget',
	description:
		'Asks for whatever is not given. A single argument that is not a component is taken as the variant name.',
	examples: ['', 'card secondary', 'secondary'],
	args: [
		{ name: 'component', description: 'primitive, block or widget' },
		{ name: 'variant', description: 'variant name' },
	],
	run: createVariant,
} satisfies Lift.Command

import { existsSync, readFileSync } from 'node:fs'
import { basename, extname, join, resolve } from 'node:path'
import { validateAndParseSvg } from '@primitives/icon/lib/svgValidator.ts'
import { posix, toKebab } from '@/_commands/lib/names.ts'

const iconDir = 'src/assets/(icon)'

async function addIcon(context: Lift.CommandContext) {
	const { generators, sync } = await import('@/_commands/lib/sync.ts')
	const source = resolve(context.cwd, context.args.file ?? '')
	if (!existsSync(source)) {
		return context.fail(`No file at ${source}`)
	}
	const base = toKebab(
		(context.args.name ?? basename(source, extname(source))).replace(/^icon-/, ''),
	)
	if (!base) {
		return context.fail('The icon name must contain at least one letter or number.')
	}
	const name = `icon-${base}`
	const svg = readFileSync(source, 'utf8')
	try {
		validateAndParseSvg(name, svg)
	} catch (error) {
		return context.fail(error instanceof Error ? error.message : String(error))
	}
	const file = await context.files.create(
		join(context.root, iconDir, `${name}.svg`),
		svg,
	)
	context.log(`Added ${posix(context.root, file)}; use it as <Icon name="${name}" />`)
	await sync(context, generators.icon)
}

export default {
	summary: 'Add an SVG icon by the icon rules',
	description:
		'Checks the SVG the way the sprite build does, then copies it into src/assets/(icon) as icon-<name>.svg. The name defaults to the file name.',
	examples: ['./heart.svg', './downloads/arrow.svg arrow-left'],
	args: [
		{ name: 'file', description: 'SVG file', required: true },
		{ name: 'name', description: 'icon name, without icon-' },
	],
	run: addIcon,
} satisfies Lift.Command

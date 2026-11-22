import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { copyBlueprint, findBlueprint } from '@/_commands/lib/blueprint.ts'
import { askInstance } from './instance.ts'
import { posix, toKebab, toPascal } from '@/_commands/lib/names.ts'
import { entriesIn, placeIn } from './place.ts'

const kinds = {
	primitives: 'primitive',
	blocks: 'block',
	widgets: 'widget',
}

export async function createComponent(
	context: Lift.CommandContext,
	kind: keyof typeof kinds,
) {
	const noun = kinds[kind]
	const pascal = toPascal(context.args.name ?? '')
	if (!pascal) {
		return context.fail(
			`The ${noun} name must contain at least one letter or number.`,
		)
	}
	const kebab = toKebab(pascal)
	const components = join(context.root, 'src/components')
	const root = join(components, kind)
	const taken = Object.keys(kinds)
		.flatMap(other => entriesIn(join(components, other)))
		.find(item => item.name === kebab)
	if (taken) {
		return context.fail(
			`${pascal} already exists at ${taken.dir}; primitives, blocks and widgets share one namespace`,
		)
	}
	const dir = placeIn(root, kebab)
	if (existsSync(dir)) {
		return context.fail(`Refusing to overwrite existing folder: ${dir}`)
	}
	const variant = (await askInstance(context, kebab)) ? 'instance' : 'plain'
	const from = findBlueprint(root, variant)
	if (!from) {
		return context.fail(`No ${variant} blueprint in ${posix(context.root, root)}`)
	}
	await copyBlueprint(context, { from, to: dir, names: { pascal, kebab } })
	context.log(`Created ${posix(context.root, dir)} from ${posix(context.root, from)}`)
}

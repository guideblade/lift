import { existsSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { posix } from '@/_commands/lib/names.ts'
import { entriesIn, find } from './lib/place.ts'

const kinds = ['primitives', 'blocks', 'presets', 'widgets']

const components = (root: string) =>
	kinds
		.flatMap(kind =>
			entriesIn(join(root, 'src/components', kind)).map(item => ({
				...item,
				label: `${item.name} (${kind}${item.group ? `/${item.group}` : ''})`,
			})),
		)
		.sort((a, b) => a.name.localeCompare(b.name))

const filesIn = (dir: string): string[] =>
	readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
		entry.isDirectory()
			? filesIn(join(dir, entry.name))
			: entry.isFile()
				? [join(dir, entry.name)]
				: [],
	)

async function cloneComponent(context: Lift.CommandContext) {
	const from = String(context.flags.template)
	const to = context.root
	if (from === to) {
		return context.fail(
			'--template and --project are the same project; pass the one to copy from with --template, or the one to copy into with --project.',
		)
	}
	const all = components(from)
	const source =
		find(all, context.args.component) ??
		(context.args.component && !context.interactive
			? context.fail(`No component ${context.args.component} in ${from}`)
			: await context.pick(
					all,
					'Select a component to clone',
					chosen => `Selected: ${chosen.label}`,
				))
	const target = join(to, relative(from, source.dir))
	if (existsSync(target)) {
		return context.fail(`${target} already exists`)
	}
	for (const file of filesIn(source.dir)) {
		await context.files.copy(file, join(target, relative(source.dir, file)))
	}
	context.log(`Cloned ${source.pascal} to ${posix(context.cwd, target)}`)
}

export default {
	summary:
		'Copy a primitive, block, preset or widget from the template into the project',
	description:
		'Copies its folder from the --template project to the same place in the --project one. Both default to their alias in `lift.aliases`.',
	examples: [
		'Card --project packages/my-site',
		'hero --template packages/my-site --project packages/blog',
	],
	args: [{ name: 'component', description: 'primitive, block, preset or widget' }],
	flags: [{ name: 'template', description: 'project to copy from', type: 'project' }],
	run: cloneComponent,
} satisfies Lift.Command

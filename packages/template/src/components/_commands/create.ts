const kinds = {
	primitive: () => import('@/components/primitives/_commands/create.ts'),
	block: () => import('@/components/blocks/_commands/create.ts'),
	preset: () => import('@/components/presets/_commands/create.ts'),
	widget: () => import('@/components/widgets/_commands/create.ts'),
}

type Kind = keyof typeof kinds

const names = Object.keys(kinds) as Kind[]

const flags = names.map(kind => `--${kind}`)

const others = (kind: Kind) => names.filter(other => other !== kind)

async function kindOf(context: Lift.CommandContext): Promise<Kind> {
	const flagged = names.find(kind => context.flags[kind])
	if (flagged) {
		return flagged
	}
	if (!context.interactive) {
		return context.fail(`Pass ${flags.slice(0, -1).join(', ')} or ${flags.at(-1)}.`)
	}
	const chosen = await context.pick(
		names.map(kind => ({ label: kind, search: [kind] })),
		'What to create',
		item => `Creating a ${item.label}`,
	)
	return chosen.label as Kind
}

export default {
	summary: 'Create a primitive, block, preset or widget',
	description:
		'Asks which unless --primitive, --block, --preset or --widget is given, then runs that kind’s own create command.',
	examples: [
		'Badge --primitive',
		'Card --block',
		'Hero --widget --plain',
		'PrimaryCta --preset button',
	],
	args: [
		{ name: 'name', description: 'Name', required: true },
		{ name: 'target', description: 'block or primitive a preset wraps' },
	],
	flags: [
		...names.map(kind => ({
			name: kind,
			description: `create a ${kind}`,
			exclusive: others(kind),
		})),
		{
			name: 'instance',
			description: 'a primitive, block or widget with its manager',
			exclusive: ['plain'],
		},
		{
			name: 'plain',
			description: 'a plain primitive, block or widget without asking',
		},
	],
	run: async context => {
		const { default: command } = await kinds[await kindOf(context)]()
		await command.run(context)
	},
} satisfies Lift.Command

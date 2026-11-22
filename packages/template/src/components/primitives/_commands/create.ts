export default {
	summary: 'Create a primitive in src/components/primitives',
	description:
		'Puts it in the group its name belongs to. Asks whether it is an instance (custom element with a manager) unless --instance or --plain is given.',
	examples: ['Badge', 'Switch --instance'],
	args: [{ name: 'name', description: 'PrimitiveName', required: true }],
	flags: [
		{
			name: 'instance',
			description: 'create an instance with its manager',
			exclusive: ['plain'],
		},
		{ name: 'plain', description: 'create a plain primitive without asking' },
	],
	run: async context => {
		const { createComponent } =
			await import('@/components/_commands/lib/component.ts')
		await createComponent(context, 'primitives')
	},
} satisfies Lift.Command

export default {
	summary: 'Create a block in src/components/blocks',
	description:
		'Puts it in the group its name belongs to. Asks whether it is an instance (custom element with a manager) unless --instance or --plain is given.',
	examples: ['Card', 'Tabs --instance'],
	args: [{ name: 'name', description: 'BlockName', required: true }],
	flags: [
		{
			name: 'instance',
			description: 'create an instance with its manager',
			exclusive: ['plain'],
		},
		{ name: 'plain', description: 'create a plain block without asking' },
	],
	run: async context => {
		const { createComponent } =
			await import('@/components/_commands/lib/component.ts')
		await createComponent(context, 'blocks')
	},
} satisfies Lift.Command

export default {
	summary: 'Create a widget in src/components/widgets',
	description:
		'Asks whether it is an instance (custom element with a manager) unless --instance or --plain is given.',
	examples: ['Hero', 'Slider --instance'],
	args: [{ name: 'name', description: 'WidgetName', required: true }],
	flags: [
		{
			name: 'instance',
			description: 'create an instance with its manager',
			exclusive: ['plain'],
		},
		{ name: 'plain', description: 'create a plain widget without asking' },
	],
	run: async context => {
		const { createComponent } =
			await import('@/components/_commands/lib/component.ts')
		await createComponent(context, 'widgets')
	},
} satisfies Lift.Command

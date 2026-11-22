export default {
	summary: "Create a component in a page's _ui folder",
	examples: ['about intro-section'],
	args: [
		{ name: 'page', description: 'PageName or parent/PageName', required: true },
		{ name: 'component', description: 'kebab-case component name', required: true },
	],
	run: async context => {
		const { createPageComponent } = await import('./lib/page.ts')
		await createPageComponent(context)
	},
} satisfies Lift.Command

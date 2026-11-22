export default {
	summary: 'Remove a page and its sections',
	examples: ['about', 'search --dev'],
	args: [
		{ name: 'name', description: 'page-name or parent/page-name', required: true },
	],
	flags: [{ name: 'dev', description: 'remove a dev page from src/pages/_dev' }],
	run: async context => {
		const { removePage } = await import('./lib/page.ts')
		removePage(context)
	},
} satisfies Lift.Command

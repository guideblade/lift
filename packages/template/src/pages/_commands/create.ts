export default {
	summary: 'Create a page with its config and e2e test',
	examples: ['about', 'blog/post', 'search --dev'],
	args: [
		{ name: 'name', description: 'page-name or parent/page-name', required: true },
	],
	flags: [{ name: 'dev', description: 'create a dev page in src/pages/_dev' }],
	run: async context => {
		const { createPage } = await import('./lib/page.ts')
		await createPage(context)
	},
} satisfies Lift.Command

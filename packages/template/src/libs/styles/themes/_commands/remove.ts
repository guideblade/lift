export default {
	summary: 'Remove a custom theme',
	examples: ['ocean'],
	args: [{ name: 'name', description: 'theme name', required: true }],
	run: async context => {
		const { removeTheme } = await import('./lib/theme.ts')
		await removeTheme(context)
	},
} satisfies Lift.Command

export default {
	summary: 'Create a theme with light and dark palettes',
	examples: ['ocean'],
	args: [{ name: 'name', description: 'theme name', required: true }],
	run: async context => {
		const { createTheme } = await import('./lib/theme.ts')
		await createTheme(context)
	},
} satisfies Lift.Command

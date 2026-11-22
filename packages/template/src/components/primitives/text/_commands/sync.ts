export default {
	summary: 'Rewrite the text form hints from its variants',
	description:
		'Run after changing the sources by hand; the commands that add them run it themselves. lift conventions check reports when it is due.',
	run: async context => {
		const { generators, sync } = await import('@/_commands/lib/sync.ts')
		await sync(context, generators.text)
	},
} satisfies Lift.Command

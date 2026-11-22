export default {
	summary: 'Remove cached photos the current tree no longer uses',
	run: async ({ root, log }) => {
		const { prunePhotos } = await import('../lib/plugin.ts')
		const removed = await prunePhotos(root)
		log(`[Photo] Removed ${removed} cached file(s) not used by the current tree.`)
	},
} satisfies Lift.Command

export const InstanceState = {
	unmounted: 'unmounted',
	mounting: 'mounting',
	mounted: 'mounted',
	unmounting: 'unmounting',
	failed: 'failed',
} as const

export type InstanceState = (typeof InstanceState)[keyof typeof InstanceState]

export const AVAILABLE_ICONS = [
	'icon-arrow-right',
	'icon-heart',
] as const

export type IconName = (typeof AVAILABLE_ICONS)[number]

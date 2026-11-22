export const ServiceAnimeState = {
	full: 'full',
	reduced: 'reduced',
} as const

export type ServiceAnimeState = (typeof ServiceAnimeState)[keyof typeof ServiceAnimeState]

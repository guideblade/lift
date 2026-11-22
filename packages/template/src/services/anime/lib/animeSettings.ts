import type { DefaultsParams } from 'animejs'

declare module '@config' {
	interface ServiceSettings {
		anime: {
			enabled: boolean
			reducedMotion: string
			defaults: DefaultsParams
		}
	}
}

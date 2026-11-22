import type { LenisOptions } from 'lenis'

declare module '@config' {
	interface ServiceSettings {
		lenis: {
			enabled: boolean
			options: Omit<
				LenisOptions,
				| 'wrapper'
				| 'content'
				| 'eventsTarget'
				| 'autoRaf'
				| 'autoToggle'
				| 'allowNestedScroll'
				| 'prevent'
			>
		}
	}
}

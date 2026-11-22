export const ServiceRevealState = {
	hidden: 'hidden',
	entering: 'entering',
	visible: 'visible',
} as const

export type ServiceRevealState =
	(typeof ServiceRevealState)[keyof typeof ServiceRevealState]

export const serviceRevealPresets = [
	'fade',
	'fade-up',
	'fade-down',
	'fade-left',
	'fade-right',
	'zoom-in',
	'zoom-out',
] as const

export type ServiceRevealPreset = (typeof serviceRevealPresets)[number]

export const serviceRevealKeyframes = 'service-reveal'

export interface ServiceRevealConfig {
	enabled: boolean
	once: boolean
	mirror: boolean
	rootMargin: string
	reducedMotion: string
	defaults: {
		preset: ServiceRevealPreset
		duration: number
		ease: string
		distance: string
	}
}

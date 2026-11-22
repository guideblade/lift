import type { PartialOptions } from 'overlayscrollbars'

export const ServiceScrollbarMode = {
	optIn: 'opt-in',
	optOut: 'opt-out',
} as const

export type ServiceScrollbarMode =
	(typeof ServiceScrollbarMode)[keyof typeof ServiceScrollbarMode]

export const ServiceScrollbarState = {
	idle: 'idle',
	scrolling: 'scrolling',
} as const

export type ServiceScrollbarState =
	(typeof ServiceScrollbarState)[keyof typeof ServiceScrollbarState]

export const serviceScrollbarNative = 'native'

export type ServiceScrollbarOptions = Omit<PartialOptions, 'scrollbars'> & {
	scrollbars?: Omit<NonNullable<PartialOptions['scrollbars']>, 'theme'>
}

export type ServiceScrollbarConfig = {
	enabled: boolean
	mode: ServiceScrollbarMode
	page: string | null
	exclude: string
	idle: number
	options: ServiceScrollbarOptions
}

export const serviceScrollbarVariables = [
	'offset-x',
	'offset-y',
	'max-x',
	'max-y',
] as const

export type ServiceScrollbarVariable = (typeof serviceScrollbarVariables)[number]

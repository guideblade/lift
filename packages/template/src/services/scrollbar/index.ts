import type * as self from '.'
import type {
	ServiceScrollbarConfig,
	ServiceScrollbarMode,
	ServiceScrollbarOptions,
	ServiceScrollbarState,
	ServiceScrollbarVariable,
} from './lib/scrollbarState'

export * from './ServiceScrollbar'
export * from './lib/scrollbarState'
export * from './lib/scrollbarAttribute'

declare module '@services' {
	interface Services {
		scrollbar: typeof self
	}

	interface ServiceTypes {
		scrollbar: {
			ServiceScrollbarConfig: ServiceScrollbarConfig
			ServiceScrollbarMode: ServiceScrollbarMode
			ServiceScrollbarOptions: ServiceScrollbarOptions
			ServiceScrollbarState: ServiceScrollbarState
			ServiceScrollbarVariable: ServiceScrollbarVariable
		}
	}
}

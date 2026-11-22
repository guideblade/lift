import type * as self from '.'
import type { ServiceLenisOptions } from './ServiceLenis'
import type { ServiceLenisState } from './lib/lenisState'
import type { ServiceLenisTarget } from './lib/nativeScroll'

export * from './ServiceLenis'
export * from './lib/lenisState'
export type { ServiceLenisTarget } from './lib/nativeScroll'
export * from './lib/lenisAttribute'

declare module '@services' {
	interface Services {
		lenis: typeof self
	}

	interface ServiceTypes {
		lenis: {
			ServiceLenisOptions: ServiceLenisOptions
			ServiceLenisState: ServiceLenisState
			ServiceLenisTarget: ServiceLenisTarget
		}
	}
}

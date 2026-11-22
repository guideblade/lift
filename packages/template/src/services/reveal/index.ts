import type * as self from '.'
import type {
	ServiceRevealConfig,
	ServiceRevealPreset,
	ServiceRevealState,
} from './lib/revealState'

export * from './ServiceReveal'
export * from './lib/revealState'
export * from './lib/revealAttribute'

declare module '@services' {
	interface Services {
		reveal: typeof self
	}

	interface ServiceTypes {
		reveal: {
			ServiceRevealConfig: ServiceRevealConfig
			ServiceRevealPreset: ServiceRevealPreset
			ServiceRevealState: ServiceRevealState
		}
	}
}

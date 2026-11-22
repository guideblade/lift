import type { ServiceRevealConfig } from './revealState'

declare module '@config' {
	interface ServiceSettings {
		reveal: ServiceRevealConfig
	}
}

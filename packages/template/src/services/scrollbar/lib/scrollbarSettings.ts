import type { ServiceScrollbarConfig } from './scrollbarState'

declare module '@config' {
	interface ServiceSettings {
		scrollbar: ServiceScrollbarConfig
	}
}

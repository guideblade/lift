import type { TailwindBreakpoint } from './site.config'

export interface ServiceSettings {
	readonly [name: string]: object | undefined
}

export interface AppConfig {
	site: {
		name: string
		language: string
		description: string
		image: string | null
		title: (page?: string) => string
	}
	seo: {
		enabled: boolean
		indexing: boolean
		sitemap: boolean
	}
	services: ServiceSettings
	elements: {
		prefix: string
	}
	bem: {
		element: string
		modifier: string
		state: string
	}
	devices: {
		small: TailwindBreakpoint
		medium: TailwindBreakpoint
		large: TailwindBreakpoint
	}
	fluid: {
		designWidth: number
		share: number
		maxScale: number
	}
}

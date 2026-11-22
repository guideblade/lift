import type * as self from '.'
import type { ServiceAnimeState } from './lib/animeState'

export * from './ServiceAnime'
export * from './lib/animeState'
export * from './lib/animeAttribute'

declare module '@services' {
	interface Services {
		anime: typeof self
	}

	interface ServiceTypes {
		anime: {
			ServiceAnimeState: ServiceAnimeState
		}
	}
}

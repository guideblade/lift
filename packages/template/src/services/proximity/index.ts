import type * as self from '.'
import type { ServiceProximityState, ServiceProximityValue } from './lib/proximityState'

export * from './ServiceProximity'
export * from './lib/proximityState'
export * from './lib/proximityAttribute'

declare module '@services' {
	interface Services {
		proximity: typeof self
	}

	interface ServiceTypes {
		proximity: {
			ServiceProximityState: ServiceProximityState
			ServiceProximityValue: ServiceProximityValue
		}
	}
}

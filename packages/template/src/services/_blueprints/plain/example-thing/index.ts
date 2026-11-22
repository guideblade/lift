import type * as self from '.'

export * from './ServiceExampleThing'
export * from './lib/exampleThingAttribute'

declare module '@services' {
	interface Services {
		exampleThing: typeof self
	}
}

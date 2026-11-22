import { startServices } from '@services'

const globalScope = (typeof window !== 'undefined'
	? window
	: globalThis) as unknown as Window

globalScope.managers ??= {}
globalScope.services ??= {}

startServices()

import { project } from '../project.ts'

export type DomLevel = 'ok' | 'warn' | 'fail'

export type DomTier = {
	label: string
	below: number
	level: DomLevel
}

export type ValidateBuildConfig = {
	dist: string
	dom: DomTier[]
	sassFunctions: string[]
}

const defaults: ValidateBuildConfig = {
	dist: 'dist',
	dom: [
		{ label: 'excellent', below: 800, level: 'ok' },
		{ label: 'normal', below: 1400, level: 'ok' },
		{ label: 'slow', below: 2000, level: 'warn' },
		{ label: 'very bad', below: Infinity, level: 'fail' },
	],
	sassFunctions: [],
}

export const validateBuild: ValidateBuildConfig = {
	...defaults,
	...project().config.validateBuild,
}

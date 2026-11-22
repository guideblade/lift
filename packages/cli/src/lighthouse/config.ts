import { project } from '../project.ts'

export type Category = 'performance' | 'accessibility' | 'best-practices' | 'seo'

export type Level = 'error' | 'warn' | 'off'

export type Threshold = {
	min: number
	level: Level
}

export type Thresholds = Record<Category, Threshold>

export type PageRule = {
	match: string | RegExp
	thresholds?: Partial<Thresholds>
	skip?: boolean
}

export type Preset = 'mobile' | 'desktop'

export type LighthouseConfig = {
	dist: string
	out: string
	runs: number
	preset: Preset
	thresholds: Thresholds
	pages: PageRule[]
}

const defaults: LighthouseConfig = {
	dist: 'dist',
	out: 'lighthouse-report',
	runs: 3,
	preset: 'mobile',
	thresholds: {
		performance: { min: 0.9, level: 'error' },
		accessibility: { min: 1, level: 'error' },
		'best-practices': { min: 1, level: 'error' },
		seo: { min: 1, level: 'error' },
	},
	pages: [],
}

const { config } = project()

export const lighthouse: LighthouseConfig = {
	...defaults,
	...config.lighthouse,
	thresholds: { ...defaults.thresholds, ...config.lighthouse?.thresholds },
}

export const base = (await config.base?.()) ?? '/'

export const devRoutes = (await config.devRoutes?.()) ?? []

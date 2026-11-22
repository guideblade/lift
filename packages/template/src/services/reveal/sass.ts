import { config } from '../../site/config/site.config.ts'
import { serviceRevealPresets } from './lib/revealState'

const list = (values: readonly string[]) =>
	`(${values.map(value => `'${value}'`).join(', ')},)`
const { reveal } = config.services

export default [
	`$reveal-enabled: ${reveal.enabled};`,
	`$reveal-reduced-motion: '${reveal.reducedMotion}';`,
	`$reveal-presets: ${list(serviceRevealPresets)};`,
	`$reveal-preset: '${reveal.defaults.preset}';`,
	`$reveal-duration: ${reveal.defaults.duration}ms;`,
	`$reveal-ease: '${reveal.defaults.ease}';`,
	`$reveal-distance: '${reveal.defaults.distance}';`,
].join('\n')

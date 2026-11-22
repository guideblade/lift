import { lift } from './lift.ts'
import { localFiles } from './owner.ts'
import { family, rule } from './rules.ts'

const sources = /\.(astro|vue|scss|css|ts|tsx|js|mjs|cjs|md)$/
const prefixed =
	/\(\s*(min|max)-(width|height|inline-size|block-size|aspect-ratio|resolution|device-width|device-height|device-aspect-ratio|color|color-index|monochrome)\s*:\s*([^)]*?)\s*\)/g

const rangeAbout =
	'media and container queries use range syntax, like `(width >= 48em)`, never `min-` or `max-` prefixes'

const ranged = (bound: string, feature: string, value: string) =>
	`(${feature} ${bound === 'min' ? '>=' : '<='} ${value})`

const mediaRange = (scope: Lift.Scope): Lift.Violation[] =>
	localFiles(scope, sources)
		.filter(file => scope.inFocus(scope.path(file)))
		.flatMap(file => {
			const text = scope.read(file) ?? ''
			return [...text.matchAll(prefixed)].map(match => {
				const [found, bound, feature, value] = match
				return lift.violation(
					'range',
					scope.path(file),
					`\`${found}\`: write \`${ranged(bound, feature, value)}\``,
					text.slice(0, match.index).split('\n').length,
				)
			})
		})

export const queries = family('queries', {
	range: rule(rangeAbout, () => mediaRange),
})

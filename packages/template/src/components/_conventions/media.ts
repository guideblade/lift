import { lift } from '@/_conventions/lift.ts'
import { family, rule } from '@/_conventions/rules.ts'
import { breakpoints, queryMixins } from './names.ts'
import { type Child, scssFiles, styleBlock } from './style-block.ts'

type Walkable = { walkAtRules(name: string, visit: (node: Child) => void): void }

const screen =
	/\b(screen|(min-|max-)?(width|height|device-width|device-height|aspect-ratio)|orientation)\b/

const advice = `a screen size is a phase: use \`@include ${queryMixins.join('|')}(${breakpoints.join('|')})\` instead`

function screenQueries(
	root: Walkable | null | undefined,
	file: string,
	line: (node: Child) => number | undefined,
) {
	const issues: Lift.Violation[] = []
	root?.walkAtRules('media', node => {
		if (node.type === 'atrule' && screen.test(node.params)) {
			issues.push(
				lift.violation(
					'phaseMedia',
					file,
					`\`@media ${node.params}\`: ${advice}`,
					line(node),
				),
			)
		}
	})
	return issues
}

function checkTemplateMedia(scope: Lift.Scope): Lift.Violation[] {
	const found = styleBlock(scope)
	return found?.root ? screenQueries(found.root, found.astro.path, found.at) : []
}

const checkScssMedia = (scope: Lift.Scope) =>
	scssFiles(scope).flatMap(file =>
		screenQueries(
			scope.scss(file),
			scope.path(file),
			node => node.source?.start?.line,
		),
	)

const phaseAbout = 'no `@media` for screen sizes in styles; phases handle the screen'

export const media = family('media', {
	phase: rule(phaseAbout, () => scope => [
		...checkTemplateMedia(scope),
		...checkScssMedia(scope),
	]),
})

export const variantMedia = family('media', {
	phase: rule(phaseAbout, () => checkScssMedia),
})

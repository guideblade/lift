import { dirname, relative, sep } from 'node:path'
import { generators, staleFiles } from '@scripts/generated.ts'
import { lift } from '@/_conventions/lift.ts'
import { family, rule } from '@/_conventions/rules.ts'
import { src } from '@/_conventions/sources.ts'

const root = dirname(src)
const posix = (path: string) => relative(root, path).split(sep).join('/')

const generatedFiles =
	(name: keyof typeof generators) =>
	(scope: Lift.Scope): Lift.Violation[] => {
		const generator = generators[name]
		try {
			return staleFiles(root, generator).map(file =>
				lift.violation(
					'generatedFiles',
					file.source,
					`\`${posix(file.path)}\` is out of date; run \`${generator.fix}\``,
				),
			)
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			return [
				lift.violation(
					'generatedFiles',
					scope.dir,
					`${message}; fix it, then run \`${generator.fix}\``,
				),
			]
		}
	}

export const generated = family('generated', {
	files: rule(
		'files this component generates match what their sources render; its `sync` command rewrites them',
		(name: keyof typeof generators) => generatedFiles(name),
	),
})

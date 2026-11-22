import { lift } from './lift.ts'
import { blueprintOf, importsOf, isWithin, layerOf, targetOf } from './sources.ts'

const allowedText = (layer: string, may: readonly string[]) =>
	may.length > 0
		? `${layer} imports only from ${may.join(', ')}`
		: `${layer} imports from no other layer`

type Found = ReturnType<typeof importsOf>[number]

function importViolation(
	{ file, value, line }: Found,
	layer: string,
	may: readonly string[],
): Lift.Violation[] {
	const target = targetOf(file, value)
	const blueprint = target && blueprintOf(target)
	if (blueprint && !isWithin(blueprint, file)) {
		return [
			lift.violation(
				'blueprintImports',
				file,
				`\`${value}\` is a blueprint; \`lift components create\` copies blueprints, nothing imports them`,
				line,
			),
		]
	}
	const to = target && layerOf(target)
	return to && to !== layer && !may.includes(to)
		? [
				lift.violation(
					'layerImports',
					file,
					`\`${value}\` is in ${to}; ${allowedText(layer, may)}`,
					line,
				),
			]
		: []
}

export const layerImports =
	(may: readonly string[]) =>
	(scope: Lift.Scope): Lift.Violation[] =>
		importsOf(scope).flatMap(found => {
			const layer = layerOf(found.file)
			return layer ? importViolation(found, layer, may) : []
		})

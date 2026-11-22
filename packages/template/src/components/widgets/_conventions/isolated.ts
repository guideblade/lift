import { join, relative, sep } from 'node:path'
import { lift } from '@/_conventions/lift.ts'
import { family, rule } from '@/_conventions/rules.ts'
import { importsOf, isWithin, layerOf, src, targetOf } from '@/_conventions/sources.ts'
import { isGroup } from '@/components/_conventions/names.ts'

const layerDirOf = (file: string) => {
	const layer = layerOf(file)
	return layer ? join(src, layer) : null
}

function outermostOf(layerDir: string, file: string) {
	const parts = relative(layerDir, file).split(sep)
	const at = parts.findIndex(part => !isGroup(part))
	return join(layerDir, ...parts.slice(0, at + 1))
}

const checkImports = (layer: string) => (scope: Lift.Scope) =>
	importsOf(scope).flatMap(({ file, value, line }) => {
		const layerDir = layerDirOf(file)
		const target = targetOf(file, value)
		return layerDir &&
			target &&
			isWithin(layerDir, target) &&
			!isWithin(outermostOf(layerDir, file), target)
			? [
					lift.violation(
						'isolatedImports',
						file,
						`\`${value}\` is another ${layer}; a ${layer} never imports one`,
						line,
					),
				]
			: []
	})

export const isolation = family('isolation', {
	imports: rule(
		'a component imports nothing from another component of its layer, by alias or relative path',
		(layer: string) => checkImports(layer),
	),
})

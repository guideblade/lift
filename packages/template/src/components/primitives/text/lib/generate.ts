import { resolve } from 'node:path'
import { buildGeneratedDefinitions, parseTextVariants } from './parse.ts'

type VariantMap = Map<string, Map<string, Map<string, string>>>

function buildStyles(variants: Map<string, VariantMap>) {
	const names = [...variants.keys()]
	const forms = [
		...new Set([...variants.values()].flatMap(entries => [...entries.keys()])),
	].sort((a, b) => Number(a) - Number(b))
	return [
		'// This file is generated from src/components/primitives/text/ui/variant/*.scss.',
		'// Do not edit it manually.',
		'',
		"@use 'sass:meta';",
		...names.map(variant => `@use '../ui/variant/${variant}';`),
		'',
		'$variants: (',
		...names.map(variant => `\t${variant}: meta.module-mixins('${variant}'),`),
		');',
		`$forms: (${forms.join(', ')}${forms.length === 1 ? ',' : ''});`,
		'',
	].join('\n')
}

export function textFiles(root: string) {
	const component = resolve(root, 'src/components/primitives/text')
	const generated = resolve(component, '_generated')
	const source = resolve(component, 'ui/variant')
	const { variants, variantDocs, docs } = parseTextVariants(source)
	return [
		{
			path: resolve(generated, 'text-form.ts'),
			source,
			content: buildGeneratedDefinitions(variants, variantDocs, docs),
		},
		{
			path: resolve(generated, 'variants.scss'),
			source,
			content: buildStyles(variants),
		},
	]
}

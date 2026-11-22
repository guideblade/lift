import { lift } from '@/_conventions/lift.ts'
import postcssScss from 'postcss-scss'
import { containerMixin, styleHeader, uiAstroFile, uiComponentName } from './names.ts'

type Root = ReturnType<typeof postcssScss.parse>
export type Child = Root['nodes'][number]

export const content = (nodes: Child[] | undefined) =>
	(nodes ?? []).filter(node => node.type !== 'comment')

export const describe = (node: Child | undefined) => {
	if (!node) {
		return 'nothing'
	}
	if (node.type === 'atrule') {
		return `@${node.name} ${node.params}`
	}
	return node.type === 'decl'
		? `${node.prop}: ${node.value}`
		: node.toString().split('{')[0]
}

export const isInclude = (node: Child | undefined, params: RegExp | string) =>
	node?.type === 'atrule' &&
	node.name === 'include' &&
	(typeof params === 'string'
		? lift.squash(node.params) === params
		: params.test(lift.squash(node.params)))

export const isContainer = (node: Child) =>
	isInclude(node, new RegExp(`^${containerMixin}(\\(|$)`))

export function styleBlock(scope: Lift.Scope) {
	const astro = scope.astro(uiAstroFile(scope))
	const [style] = astro?.elements('style') ?? []
	if (!astro || !style) {
		return null
	}
	const { value, line } = astro.content(style)
	const at = (node?: Child) => line + (node?.source?.start?.line ?? 1) - 1
	try {
		return { astro, style, at, root: postcssScss.parse(value), error: null }
	} catch (error) {
		return { astro, style, at, root: null, error: String(error) }
	}
}

export function header(component: string, nodes: Child[]) {
	const expected = styleHeader(component)
	const index = expected.findIndex(
		(use, i) => lift.squash(describe(nodes[i])) !== lift.squash(use),
	)
	if (index !== -1) {
		return { index, expected: expected[index] }
	}
	const name = nodes[3]
	if (
		!(name?.type === 'decl' && name.prop === '$name' && name.value === 'block.$name')
	) {
		return { index: 3, expected: '$name: block.$name' }
	}
	const layer = nodes[4]
	return layer?.type === 'atrule' && layer.name === 'layer' && nodes.length === 5
		? null
		: { index: 4, expected: '@layer <layer> { … } as the last statement' }
}

const isSelf = (node: Child | undefined) =>
	node?.type === 'decl' && node.prop === '$self' && node.value === '&'

export function nameRule(layer: Child | undefined) {
	const [rule, ...rest] = content(layer?.type === 'atrule' ? layer.nodes : [])
	if (rule?.type !== 'rule' || rule.selector !== '.#{$name}' || rest.length > 0) {
		return null
	}
	return isSelf(content(rule.nodes)[0]) ? rule : null
}

export function block(scope: Lift.Scope) {
	const found = styleBlock(scope)
	const nodes = content(found?.root?.nodes)
	if (!found?.root || header(uiComponentName(scope), nodes)) {
		return null
	}
	const layer = nodes[4]
	return { ...found, layer, rule: nameRule(layer) }
}

export const scssFiles = (scope: Lift.Scope) =>
	scope
		.entries()
		.filter(entry => entry.isFile() && entry.name.endsWith('.scss'))
		.map(entry => entry.name)

export function checkTemplateContainer(scope: Lift.Scope): Lift.Violation[] {
	const found = block(scope)
	const allowed = found?.rule ?? null
	const issues: Lift.Violation[] = []
	if (found?.root && allowed) {
		const { astro, at } = found
		found.root.walkAtRules('include', node => {
			if (isContainer(node) && node.parent !== allowed) {
				const message = `\`@include ${containerMixin}\` belongs directly inside \`.#{$name}\``
				issues.push(
					lift.violation('containerPlacement', astro.path, message, at(node)),
				)
			}
		})
	}
	return issues
}

export function checkScssContainer(scope: Lift.Scope): Lift.Violation[] {
	const issues: Lift.Violation[] = []
	for (const file of scssFiles(scope)) {
		scope.scss(file)?.walkAtRules('include', node => {
			if (isContainer(node)) {
				const message = `\`@include ${containerMixin}\` belongs in the .astro style block`
				issues.push(
					lift.violation(
						'containerPlacement',
						scope.path(file),
						message,
						node.source?.start?.line,
					),
				)
			}
		})
	}
	return issues
}

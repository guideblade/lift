import { lift } from '@/_conventions/lift.ts'
import { family, rule } from '@/_conventions/rules.ts'
import { type Child, isInclude, scssFiles } from './style-block.ts'

function checkHover(scope: Lift.Scope): Lift.Violation[] {
	const issues: Lift.Violation[] = []
	for (const file of scssFiles(scope)) {
		const roots = new Map<Child, number>()
		const report = (node: Child, message: string) =>
			issues.push(
				lift.violation(
					'hoverMixin',
					scope.path(file),
					message,
					node.source?.start?.line,
				),
			)
		scope.scss(file)?.walkAtRules('include', node => {
			if (!isInclude(node, /^hover(\(|$)/)) {
				return
			}
			if (!isInclude(node, 'hover($self)')) {
				report(node, 'write `@include hover($self)`')
				return
			}
			const parent = node.parent as Child | undefined
			if (parent?.type === 'atrule' && parent.name === 'mixin') {
				const count = (roots.get(parent) ?? 0) + 1
				roots.set(parent, count)
				if (count > 1) {
					report(
						node,
						`one root \`@include hover($self)\` per \`@mixin ${parent.params}\``,
					)
				}
			}
		})
	}
	return issues
}

export const hover = family('hover', {
	mixin: rule(
		'hovers use `@include hover($self)`, with at most one directly inside each phase mixin',
		() => checkHover,
	),
})

import type { AttributeNode, Node, TagLikeNode } from '@astrojs/compiler/types'
import type { Expression } from 'oxc-parser'
import { lift } from '@/_conventions/lift.ts'
import { localFiles } from '@/_conventions/owner.ts'
import { family, rule } from '@/_conventions/rules.ts'

type Found = { file: string; tag: TagLikeNode; attribute: AttributeNode }

const bem = /^component\.(block|(element|variant|state)\(.*\))$/

const tagsOf = (nodes: Node[]): TagLikeNode[] =>
	nodes.flatMap(node => [
		...('attributes' in node ? [node] : []),
		...('children' in node ? tagsOf(node.children) : []),
	])

const attributesOf = (scope: Lift.Scope, name: string): Found[] =>
	localFiles(scope, /\.astro$/)
		.filter(file => scope.inFocus(scope.path(file)))
		.flatMap(file =>
			tagsOf(scope.astro(file)?.ast.children ?? []).flatMap(tag => {
				const attribute = lift.attribute(tag, name)
				return attribute ? [{ file: scope.path(file), tag, attribute }] : []
			}),
		)

const lineOf = ({ attribute, tag }: Found) =>
	attribute.position?.start.line ?? tag.position?.start.line

function checkBem(scope: Lift.Scope): Lift.Violation[] {
	return attributesOf(scope, 'class')
		.filter(
			({ attribute }) =>
				attribute.kind !== 'expression' ||
				!bem.test(lift.squash(attribute.value)),
		)
		.map(found =>
			lift.violation(
				'bemClass',
				found.file,
				`\`class\` is only for BEM (\`component.block\`, \`component.element(…)\`); move \`${found.attribute.value}\` into \`class:list\``,
				lineOf(found),
			),
		)
}

const variantOf = (token: string) => {
	let depth = 0
	let cut = -1
	for (const [at, char] of [...token].entries()) {
		if (char === '[') {
			depth++
		}
		if (char === ']') {
			depth--
		}
		if (char === ':' && depth === 0) {
			cut = at
		}
	}
	return token.slice(0, cut + 1)
}

const shown = (variant: string) => (variant ? `\`${variant}\`` : 'unprefixed')

function stringsOf(node: Expression | null | undefined): string[] {
	if (!node) {
		return []
	}
	switch (node.type) {
		case 'Literal':
			return typeof node.value === 'string' ? [node.value] : []
		case 'TemplateLiteral':
			return node.expressions.length === 0
				? node.quasis.map(quasi => quasi.value.cooked ?? '')
				: []
		case 'ArrayExpression':
			return node.elements.flatMap(item =>
				item && item.type !== 'SpreadElement' ? stringsOf(item) : [],
			)
		case 'LogicalExpression':
			return stringsOf(node.right)
		case 'ConditionalExpression':
			return [...stringsOf(node.consequent), ...stringsOf(node.alternate)]
		default:
			return []
	}
}

const directOf = (node: Expression) =>
	node.type === 'ArrayExpression'
		? node.elements.flatMap(item =>
				item?.type === 'Literal' && typeof item.value === 'string'
					? [item.value]
					: [],
			)
		: stringsOf(node)

function groupIssues(expression: Expression): string[] {
	const mixed = stringsOf(expression).flatMap(text => {
		const variants = [...new Set(text.split(/\s+/).filter(Boolean).map(variantOf))]
		return variants.length > 1
			? [
					`split \`'${text}'\` into one string per variant: ${variants.map(shown).join(', ')}`,
				]
			: []
	})
	const seen = new Map<string, number>()
	for (const text of directOf(expression)) {
		for (const variant of new Set(text.split(/\s+/).filter(Boolean).map(variantOf))) {
			seen.set(variant, (seen.get(variant) ?? 0) + 1)
		}
	}
	const split = [...seen]
		.filter(([, count]) => count > 1)
		.map(([variant]) => `put all ${shown(variant)} classes in one string`)
	return [...mixed, ...split]
}

function checkGroups(scope: Lift.Scope): Lift.Violation[] {
	return attributesOf(scope, 'class:list')
		.filter(found => found.attribute.kind === 'expression')
		.flatMap(found => {
			const parsed = lift.parseExpression(found.attribute.value)
			return (parsed ? groupIssues(parsed.expression) : []).map(message =>
				lift.violation('classListGroups', found.file, message, lineOf(found)),
			)
		})
}

export const classes = family('classes', {
	bem: rule(
		'`class` holds only BEM: `component.block` or `component.element|variant|state(…)`; Tailwind and other classes go in `class:list`',
		() => checkBem,
	),
	listGroups: rule(
		'in `class:list`, each string holds the classes of one variant (`hover:`, `md:`, …), and each variant has one string',
		() => checkGroups,
	),
})

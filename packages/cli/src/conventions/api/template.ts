import type { TagLikeNode } from '@astrojs/compiler/types'
import type { Violation } from '../types.ts'
import { attribute, spreads } from './astro.ts'
import { describeArg, matches, resolve, show, showAll } from './pattern.ts'
import { parseExpression, squash } from './script.ts'
import type { Arg, Check, Pattern, Scope } from './types.ts'
import { violation } from './violation.ts'

type RootCheck = (root: TagLikeNode, astro: Lift.AstroFile, scope: Scope) => Violation[]

const withRoot =
	(file: Arg<string>, run: RootCheck) =>
	(scope: Scope): Violation[] => {
		const astro = scope.astro(resolve(file, scope))
		const root = astro?.root
		return astro && root ? run(root, astro, scope) : []
	}

const lineOf = (root: TagLikeNode) => root.position?.start.line

export const parses = (file: Arg<string>): Check => ({
	id: 'parses',
	description: `${describeArg(file, show)} parses`,
	run: scope => {
		const path = resolve(file, scope)
		const astro = path.endsWith('.astro') ? scope.astro(path) : null
		const errors = astro
			? [
					...astro.errors,
					...(astro.frontmatter?.errors ?? []),
					...astro
						.elements('script')
						.flatMap(node => astro.script(node).errors),
				]
			: (scope.ts(path)?.errors ?? [])
		return errors.map(error => violation('parses', scope.path(path), error))
	},
})

export const singleRoot = (file: Arg<string>): Check => ({
	id: 'singleRoot',
	description: `${describeArg(file, show)} has exactly one root element`,
	run: scope => {
		const astro = scope.astro(resolve(file, scope))
		if (!astro || astro.root) {
			return []
		}
		const [first, second] = astro.roots
		const message =
			astro.roots.length === 1
				? `the root must be an element, found \`${first?.type}\``
				: `template must have exactly one root element, found ${astro.roots.length} root nodes`
		const line = (second ?? first)?.position?.start.line
		return [violation('singleRoot', astro.path, message, line)]
	},
})

export const rootTag = (file: Arg<string>, patterns: Arg<readonly Pattern[]>): Check => ({
	id: 'rootTag',
	description: `the root of ${describeArg(file, show)} is one of ${describeArg(patterns, showAll)}`,
	run: withRoot(file, (root, astro, scope) => {
		const allowed = resolve(patterns, scope)
		return allowed.some(pattern => matches(root.name, pattern, scope))
			? []
			: [
					violation(
						'rootTag',
						astro.path,
						`root <${root.name}> is not allowed; allowed: ${showAll(allowed)}`,
						lineOf(root),
					),
				]
	}),
})

const showSpread = (pattern: string | RegExp) =>
	typeof pattern === 'string' ? `{...${pattern}}` : `{...${String(pattern)}}`

export const rootSpreads = (file: Arg<string>, pattern: Arg<string | RegExp>): Check => ({
	id: 'rootSpreads',
	description: `the root of ${describeArg(file, show)} spreads ${describeArg(pattern, showSpread)}`,
	run: withRoot(file, (root, astro, scope) => {
		const expected = resolve(pattern, scope)
		return spreads(root).some(item => matches(item, expected, scope))
			? []
			: [
					violation(
						'rootSpreads',
						astro.path,
						`spread \`${showSpread(expected)}\` on the root element`,
						lineOf(root),
					),
				]
	}),
})

function classListItems(root: TagLikeNode) {
	const parsed = parseExpression(attribute(root, 'class:list')?.value ?? '')
	if (!parsed || parsed.expression.type !== 'ArrayExpression') {
		return []
	}
	return parsed.expression.elements.flatMap(item =>
		item ? [parsed.script.text(item)] : [],
	)
}

export const rootClassList = (
	file: Arg<string>,
	items: Arg<readonly string[]>,
): Check => ({
	id: 'rootClassList',
	description: `the root of ${describeArg(file, show)} has \`class:list\` with ${describeArg(items, showAll)}`,
	run: withRoot(file, (root, astro, scope) => {
		const present = classListItems(root)
		return resolve(items, scope)
			.filter(item => !present.includes(squash(item)))
			.map(item =>
				violation(
					'rootClassList',
					astro.path,
					`root \`class:list\` must include \`${item}\``,
					lineOf(root),
				),
			)
	}),
})

export const rootWithout = (file: Arg<string>, attributes: readonly string[]): Check => ({
	id: 'rootWithout',
	description: `the root of ${describeArg(file, show)} has none of ${showAll(attributes)}`,
	run: withRoot(file, (root, astro) =>
		attributes
			.filter(name => attribute(root, name))
			.map(name =>
				violation(
					'rootWithout',
					astro.path,
					`remove \`${name}\` from the root element`,
					lineOf(root),
				),
			),
	),
})

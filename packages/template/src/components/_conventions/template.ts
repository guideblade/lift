import type { TSPropertySignature } from 'oxc-parser'
import { lift } from '@/_conventions/lift.ts'
import { family, rule } from '@/_conventions/rules.ts'
import { isInstance } from './instance.ts'
import { astroFile, propsType, uiAstroFile } from './names.ts'

const htmlTag = /^[a-z][a-z0-9]*$/
const lowercase = /^[a-z]/
const classList = ['component.block', 'component.variant(variant)', 'className']
const rootAttributes = /^componentAttributes\(component\.block,\{hover,hoverSource,?\}\)$/

function frontmatterOf(scope: Lift.Scope, file = uiAstroFile(scope)) {
	const astro = scope.astro(file)
	return { astro, script: astro?.frontmatter ?? null }
}

function rootElement(scope: Lift.Scope) {
	const root = scope.astro(uiAstroFile(scope))?.root
	return root?.type === 'element' ? root.name : null
}

function propsRest(scope: Lift.Scope) {
	const { astro, script } = frontmatterOf(scope)
	if (!astro || (script && lift.ast.restName(script) === 'props')) {
		return []
	}
	return [
		lift.violation(
			'propsRest',
			astro.path,
			'destructure the rest as `const { …, ...props } = Astro.props as Props`',
			script?.line() ?? 1,
		),
	]
}

function tagFromProps(scope: Lift.Scope) {
	const { astro, script } = frontmatterOf(scope, astroFile(scope))
	const root = astro?.root
	if (!astro || root?.type !== 'component' || root.name !== 'Tag') {
		return []
	}
	return script && lift.ast.propsKeys(script).has('tag')
		? []
		: [
				lift.violation(
					'tagFromProps',
					astro.path,
					'<Tag> must come from the `tag` prop: `const { tag: Tag, … } = Astro.props as Props`',
					root.position?.start.line,
				),
			]
}

function lowercaseProps(scope: Lift.Scope) {
	const { astro, script } = frontmatterOf(scope)
	if (!astro || !script) {
		return []
	}
	const declared = script
		.find<TSPropertySignature>('TSPropertySignature')
		.flatMap(node => (node.key.type === 'Identifier' ? [node.key.name] : []))
	const names = new Set([...declared, ...lift.ast.propsKeys(script)])
	return [...names]
		.filter(name => !lowercase.test(name))
		.map(name =>
			lift.violation(
				'lowercaseProps',
				astro.path,
				`rename the \`${name}\` prop to start with a lowercase letter`,
				script.line(),
			),
		)
}

export const props = family('props', {
	lowercase: rule('prop names start with a lowercase letter', () =>
		lift.check('lowercaseProps', 'check prop names', lowercaseProps),
	),
	type: rule('the component declares exactly one `type Props = …`', () =>
		lift.declaresType(uiAstroFile, propsType),
	),
	baseProps: rule('`Props` includes `BaseProps`', () =>
		lift.typeIncludes(uiAstroFile, propsType, /^BaseProps(<|$)/),
	),
	rest: rule('the rest of `Astro.props as Props` is destructured as `...props`', () =>
		lift.check('propsRest', 'check rest props', propsRest),
	),
	rootSpread: rule('the root element spreads `{...props}`', () =>
		lift.rootSpreads(uiAstroFile, 'props'),
	),
	rootAttributes: rule('`Props` includes `HTMLAttributes` of the root element', () =>
		lift.typeIncludes(uiAstroFile, propsType, function rootAttributes(scope) {
			const tag = rootElement(scope)
			return tag ? `HTMLAttributes<'${tag}'>` : /^HTMLAttributes</
		}),
	),
})

export const template = family('template', {
	singleRoot: rule('the template has exactly one root element', () =>
		lift.singleRoot(uiAstroFile),
	),
	componentAttributes: rule(
		'the root spreads `componentAttributes(component.block, { hover, hoverSource })`',
		() => lift.rootSpreads(uiAstroFile, rootAttributes),
	),
	rootClassList: rule(
		'the root `class:list` has `component.block`, `component.variant(variant)` and `className`',
		() => lift.rootClassList(uiAstroFile, classList),
	),
	rootWithoutClass: rule('the root has no `class`, only `class:list`', () =>
		lift.rootWithout(uiAstroFile, ['class']),
	),
	block: rule(
		'the component declares `const component = createBlock(deriveName(Astro.self))`',
		() =>
			lift.declares(
				uiAstroFile,
				'component',
				'createBlock(deriveName(Astro.self))',
			),
	),
})

export const componentTemplate = family('template', {
	rootTag: rule('a plain component’s root is an HTML tag or `<Tag>`', () =>
		lift.unless(isInstance, lift.rootTag(astroFile, [htmlTag, 'Tag'])),
	),
	tagFromProps: rule(
		'`<Tag>` comes from the `tag` prop',
		() => (scope: Lift.Scope) => (isInstance(scope) ? [] : tagFromProps(scope)),
	),
})

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { lift } from '@/_conventions/lift.ts'
import { family, rule } from '@/_conventions/rules.ts'
import { src } from '@/_conventions/sources.ts'
import type { Class, ObjectExpression, PropertyDefinition } from 'oxc-parser'
import { deriveName } from '@libs/astro/derive-name/deriveName.ts'
import { astroFile, instanceFiles, uiAstroFile, uiComponentName } from './names.ts'

const behaviors = join(src, 'behaviors')
const behavior = /^Behavior\w+$/
const instanceFile = /^(Instance|Manager)\w*\.ts$/
const instanceCalls = /\b(elementTag|instanceAttributes)\(/

export function isInstance(scope: Lift.Scope) {
	return (
		scope.entries().some(entry => instanceFile.test(entry.name)) ||
		instanceCalls.test(scope.astro(astroFile(scope))?.frontmatter?.source ?? '')
	)
}

const instanceName = (scope: Lift.Scope) => `Instance${scope.pascal}`
const managerName = (scope: Lift.Scope) => `Manager${scope.pascal}`

const kebabOf = (name: string) =>
	deriveName(Object.assign(() => undefined, { moduleId: name }))

function behaviorFile(name: string) {
	return behavior.test(name)
		? join(behaviors, kebabOf(name).replace(/^behavior-/, ''), `${name}.ts`)
		: null
}

function behaviorClass(name: string | null) {
	const file = name ? behaviorFile(name) : null
	if (!name || !file || !existsSync(file)) {
		return null
	}
	return lift.ast.exportedClass(new lift.Script(file, readFileSync(file, 'utf8')), name)
}

function staticRequiresJs(found: Class | null): boolean | null | undefined {
	const property = found?.body.body.find(
		(item): item is PropertyDefinition =>
			item.type === 'PropertyDefinition' &&
			item.static &&
			item.key.type === 'Identifier' &&
			item.key.name === 'requiresJs',
	)
	return property ? lift.ast.booleanOf(property.value) : undefined
}

function classRequiresJs(scope: Lift.Scope) {
	const script = scope.ts(`${instanceName(scope)}.ts`)
	const found = script ? lift.ast.exportedClass(script, instanceName(scope)) : null
	const own = staticRequiresJs(found)
	if (own !== undefined) {
		return own
	}
	return staticRequiresJs(behaviorClass(lift.ast.superName(found))) ?? true
}

function templateRequiresJs(scope: Lift.Scope) {
	const spread = scope
		.astro(astroFile(scope))
		?.root?.attributes.find(
			item =>
				item.kind === 'spread' &&
				item.name.trim().startsWith('instanceAttributes('),
		)
	const parsed = spread ? lift.parseExpression(spread.name) : null
	const call = parsed?.expression.type === 'CallExpression' ? parsed.expression : null
	const options = call?.arguments[1] as ObjectExpression | undefined
	const property = options?.properties.find(
		item =>
			item.type === 'Property' &&
			item.key.type === 'Identifier' &&
			item.key.name === 'requiresJs',
	)
	return property?.type === 'Property' ? lift.ast.booleanOf(property.value) : true
}

function checkRequiresJs(scope: Lift.Scope) {
	const template = templateRequiresJs(scope)
	const instance = classRequiresJs(scope)
	return template === instance || !scope.astro(astroFile(scope))?.root
		? []
		: [
				lift.violation(
					'requiresJs',
					scope.path(`${instanceName(scope)}.ts`),
					`requiresJs is ${instance} here but ${template} in the template`,
				),
			]
}

export const instance = family('instance', {
	files: rule(
		'an instance component has `Instance<Name>.ts` and `Manager<Name>.ts`',
		() => lift.requiredItems('file', scope => instanceFiles(scope.pascal)),
	),
	baseClass: rule(
		'`Instance<Name>` extends `BaseInstance`, directly or through its behavior',
		() =>
			lift.extendsClass(
				scope => `${instanceName(scope)}.ts`,
				instanceName,
				'BaseInstance',
				{ via: behaviorFile },
			),
	),
	define: rule('`Instance<Name>.ts` ends with `defineElement(Instance<Name>)`', () =>
		lift.endsWith(
			scope => `${instanceName(scope)}.ts`,
			scope => `defineElement(${instanceName(scope)})`,
		),
	),
	managerClass: rule('`Manager<Name>` extends `BaseManager<Instance<Name>>`', () =>
		lift.extendsClass(
			scope => `${managerName(scope)}.ts`,
			managerName,
			scope => `BaseManager<${instanceName(scope)}>`,
		),
	),
	requiresJs: rule(
		'`requiresJs` in instanceAttributes() equals `static requiresJs` of the Instance class (both default to true)',
		() => checkRequiresJs,
	),
})

export const instanceUi = family('instance', {
	rootTag: rule('the root is `<Tag>`', () => lift.rootTag(uiAstroFile, ['Tag'])),
	tag: rule('the component declares `const Tag = elementTag(component.block)`', () =>
		lift.declares(uiAstroFile, 'Tag', 'elementTag(component.block)'),
	),
	attributes: rule('the root spreads `instanceAttributes(component.block, …)`', () =>
		lift.rootSpreads(uiAstroFile, /^instanceAttributes\(component\.block\b/),
	),
	imports: rule('the template imports `../Instance<Name>`', () =>
		lift.imports(
			uiAstroFile,
			scope => `../Instance${lift.toPascal(uiComponentName(scope))}`,
		),
	),
})

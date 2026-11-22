import type {
	Class,
	Expression,
	ImportDeclaration,
	ImportDeclarationSpecifier,
	ObjectExpression,
	ObjectPattern,
	PropertyKey,
	TSTypeAliasDeclaration,
	TSTypeReference,
	VariableDeclarator,
} from 'oxc-parser'
import { collect } from './script.ts'

type Script = Lift.Script

export type Entry = {
	key: string | null
	local: string | null
	node: ObjectExpression['properties'][number]
}

const astroProps = new Set(['Astro.props', 'Astro.propsasProps'])

export function propsPattern(script: Script): ObjectPattern | null {
	const [declarator] = script.find<VariableDeclarator>(
		'VariableDeclarator',
		node => node.init !== null && astroProps.has(script.text(node.init)),
	)
	return declarator?.id.type === 'ObjectPattern' ? declarator.id : null
}

export function propsKeys(script: Script) {
	const keys = new Set<string>()
	for (const property of propsPattern(script)?.properties ?? []) {
		if (property.type === 'Property' && property.key.type === 'Identifier') {
			keys.add(property.key.name)
		}
	}
	return keys
}

export function restName(script: Script) {
	const rest = propsPattern(script)?.properties.find(
		item => item.type === 'RestElement',
	)
	return rest?.argument.type === 'Identifier' ? rest.argument.name : null
}

export function declarator(script: Script, name: string) {
	const [found] = script.find<VariableDeclarator>(
		'VariableDeclarator',
		node => node.id.type === 'Identifier' && node.id.name === name,
	)
	return found ?? null
}

export function declared(script: Script, name: string) {
	const init = declarator(script, name)?.init
	return init ? script.text(init) : null
}

export function inlined(script: Script, name: string) {
	const init = declarator(script, name)?.init
	if (!init || init.type !== 'CallExpression') {
		return init ? script.text(init) : null
	}
	const args = init.arguments.map(arg =>
		arg.type === 'Identifier'
			? (declared(script, arg.name) ?? arg.name)
			: script.text(arg),
	)
	return `${script.text(init.callee)}(${args.join(',')})`
}

export const refName = (ref: TSTypeReference) =>
	ref.typeName.type === 'Identifier' ? ref.typeName.name : null

export function typeReferences(script: Script, type: string) {
	const aliases = new Map(
		script
			.find<TSTypeAliasDeclaration>('TSTypeAliasDeclaration')
			.map(alias => [alias.id.name, alias]),
	)
	const seen = new Set<string>()
	const found: TSTypeReference[] = []
	const follow = (name: string) => {
		const alias = aliases.get(name)
		if (!alias || seen.has(name)) {
			return
		}
		seen.add(name)
		for (const ref of collect<TSTypeReference>(
			alias.typeAnnotation,
			'TSTypeReference',
		)) {
			found.push(ref)
			follow(refName(ref) ?? '')
		}
	}
	follow(type)
	return found
}

const keyName = (key: PropertyKey) => {
	if (key.type === 'Identifier') {
		return key.name
	}
	return key.type === 'Literal' && typeof key.value === 'string' ? key.value : null
}

export const objectEntries = (object: ObjectExpression): Entry[] =>
	object.properties.flatMap(node =>
		node.type === 'Property' && !node.computed
			? [
					{
						key: keyName(node.key),
						local: node.value.type === 'Identifier' ? node.value.name : null,
						node,
					},
				]
			: [],
	)

export function exportedConst(script: Script, name: string): VariableDeclarator | null {
	for (const statement of script.program.body) {
		if (
			statement.type === 'ExportNamedDeclaration' &&
			statement.declaration?.type === 'VariableDeclaration'
		) {
			const found = statement.declaration.declarations.find(
				node => node.id.type === 'Identifier' && node.id.name === name,
			)
			if (found) {
				return found
			}
		}
	}
	return null
}

export function exportedClass(script: Script, name: string): Class | null {
	for (const statement of script.program.body) {
		const declaration =
			statement.type === 'ExportNamedDeclaration' ? statement.declaration : null
		if (declaration?.type === 'ClassDeclaration' && declaration.id?.name === name) {
			return declaration
		}
	}
	return null
}

export const superName = (found: Class | null) =>
	found?.superClass?.type === 'Identifier' ? found.superClass.name : null

const importedName = (specifier: ImportDeclarationSpecifier) => {
	if (specifier.type !== 'ImportSpecifier') {
		return 'default'
	}
	const { imported } = specifier
	return imported.type === 'Identifier' ? imported.name : String(imported.value)
}

export function importOf(script: Script, local: string | null) {
	for (const node of script.find<ImportDeclaration>('ImportDeclaration')) {
		const specifier = node.specifiers.find(item => item.local.name === local)
		if (specifier) {
			return { source: node.source.value, imported: importedName(specifier) }
		}
	}
	return undefined
}

export const booleanOf = (value: Expression | null | undefined) =>
	value?.type === 'Literal' && typeof value.value === 'boolean' ? value.value : null

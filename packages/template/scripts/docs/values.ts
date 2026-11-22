import ts from 'typescript'
import type { DocKind, DocsOptions, DocValue } from './types.ts'

const nullish = ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Void

const members = (type: ts.Type) => (type.isUnion() ? type.types : [type])
const present = (type: ts.Type) =>
	members(type).filter(member => !(member.flags & nullish))

const isText = (type: ts.Type): boolean =>
	Boolean(type.flags & ts.TypeFlags.StringLike) ||
	(type.isIntersection() && type.types.some(isText))

const literalOf = (type: ts.Type) =>
	type.isStringLiteral() || type.isNumberLiteral() ? type.value : null

export function classify(type: ts.Type): {
	kind: DocKind
	options: Array<string | number>
} {
	const types = present(type)
	const literals = types.map(literalOf).filter(value => value !== null)
	if (!types.length) {
		return { kind: 'none', options: [] }
	}
	if (types.every(member => member.flags & ts.TypeFlags.BooleanLike)) {
		return { kind: 'boolean', options: [] }
	}
	if (literals.length === types.length) {
		return { kind: 'enum', options: literals }
	}
	if (types.every(isText)) {
		return { kind: 'string', options: literals }
	}
	if (types.every(member => member.flags & ts.TypeFlags.NumberLike)) {
		return { kind: 'number', options: literals }
	}
	const callable = types.some(member => member.getCallSignatures().length)
	return { kind: callable ? 'none' : 'json', options: [] }
}

type Context = { checker: ts.TypeChecker; settings: DocsOptions; depth: number }

function objectOf(type: ts.Type, context: Context): DocValue {
	const { checker } = context
	const entries = checker
		.getPropertiesOfType(type)
		.filter(property => !(property.flags & ts.SymbolFlags.Optional))
		.map(property => [
			property.name,
			valueOf(checker.getTypeOfSymbol(property), {
				...context,
				depth: context.depth + 1,
			}),
		])
	return Object.fromEntries(entries.filter(([, value]) => value !== undefined))
}

function memberValue(type: ts.Type, context: Context): DocValue | undefined {
	const { checker, settings, depth } = context
	const literal = literalOf(type)
	if (literal !== null) {
		return literal
	}
	if (type.flags & ts.TypeFlags.BooleanLike) {
		return checker.typeToString(type) === 'true'
	}
	if (isText(type)) {
		return settings.text
	}
	if (type.flags & ts.TypeFlags.NumberLike) {
		return 0
	}
	if (type.getCallSignatures().length || depth > 2) {
		return undefined
	}
	if (checker.isArrayType(type) || checker.isTupleType(type)) {
		return []
	}
	return type.flags & ts.TypeFlags.Object ? objectOf(type, context) : undefined
}

export function valueOf(type: ts.Type, context: Context): DocValue | undefined {
	const types = present(type)
	if (!types.length) {
		return members(type).some(member => member.flags & ts.TypeFlags.Null)
			? null
			: undefined
	}
	const preferred = types.find(
		member => literalOf(member) === context.settings.preferred,
	)
	const literals = types.filter(member => literalOf(member) !== null)
	const ordered = preferred
		? [preferred]
		: [...literals, ...types.filter(member => !literals.includes(member))]
	for (const member of ordered) {
		const value = memberValue(member, context)
		if (value !== undefined) {
			return value
		}
	}
	return undefined
}

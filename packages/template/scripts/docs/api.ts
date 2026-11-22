import { basename, dirname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import {
	deriveInstanceName,
	type InstanceKind,
} from '../../src/libs/instance/derive-instance-name/deriveInstanceName.ts'
import { external } from './program.ts'
import type { DocApi, DocMember, DocMethod, DocProp } from './types.ts'
import { classify } from './values.ts'

const hidden =
	ts.ModifierFlags.Private | ts.ModifierFlags.Protected | ts.ModifierFlags.Static
const lifecycle = /Callback$/
const dispatched = /\bthis\.dispatch\s*(?:<[^>]*>)?\s*\(\s*['"`]([\w:-]+)['"`]/g
const nullish = ts.TypeFlags.Undefined | ts.TypeFlags.Null

const core = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/libs/instance')
	.split(sep)
	.join('/')

type Origin = { from: string; base: boolean }

const own = (node: ts.Node) => !external(node.getSourceFile().fileName)
const builtin = (node: ts.Node) =>
	/\/typescript\/lib\/lib\.[^/]+\.d\.ts$/.test(node.getSourceFile().fileName)

function originOf(node: ts.Node): Origin {
	const parent = node.parent
	return {
		from: parent && ts.isClassLike(parent) ? (parent.name?.text ?? '') : '',
		base: node.getSourceFile().fileName.startsWith(core),
	}
}

const describe = (checker: ts.TypeChecker, symbol: ts.Symbol) =>
	ts.displayPartsToString(symbol.getDocumentationComment(checker))

function visible(symbol: ts.Symbol) {
	const declarations = symbol.declarations ?? []
	return (
		declarations.length > 0 &&
		declarations.every(own) &&
		!symbol.name.includes('#') &&
		!lifecycle.test(symbol.name) &&
		declarations.every(
			node => !(ts.getCombinedModifierFlags(node as ts.Declaration) & hidden),
		)
	)
}

function isReference(checker: ts.TypeChecker, type: ts.Type) {
	const declarations = type.getSymbol()?.declarations ?? []
	return (
		Boolean(type.flags & ts.TypeFlags.Object) &&
		!checker.isArrayType(type) &&
		declarations.length > 0 &&
		declarations.some(node => ts.isClassLike(node) || builtin(node))
	)
}

function field(
	checker: ts.TypeChecker,
	name: string,
	type: ts.Type,
	extra: Partial<DocProp> = {},
): DocProp {
	const present = checker.getNonNullableType(type)
	return {
		name,
		type: checker.typeToString(type.flags & ts.TypeFlags.Unknown ? type : present),
		...(isReference(checker, present)
			? { kind: 'none', options: [] }
			: classify(type)),
		optional: Boolean(
			type.isUnion() && type.types.some(item => item.flags & nullish),
		),
		default: null,
		description: '',
		...extra,
	}
}

function param(checker: ts.TypeChecker, symbol: ts.Symbol): DocProp {
	const node = symbol.valueDeclaration
	const declaration = node && ts.isParameter(node) ? node : null
	return field(checker, symbol.name, checker.getTypeOfSymbol(symbol), {
		optional: declaration ? checker.isOptionalParameter(declaration) : false,
		default: declaration?.initializer?.getText() ?? null,
		description: declaration
			? ts
					.getJSDocParameterTags(declaration)
					.map(tag => ts.getTextOfJSDocComment(tag.comment) ?? '')
					.join(' ')
			: '',
	})
}

function method(checker: ts.TypeChecker, symbol: ts.Symbol, origin: Origin): DocMethod {
	const signature = checker.getTypeOfSymbol(symbol).getCallSignatures()[0]
	return {
		name: symbol.name,
		description: describe(checker, symbol),
		...origin,
		params: signature?.getParameters().map(item => param(checker, item)) ?? [],
		returns: signature ? checker.typeToString(signature.getReturnType()) : 'void',
	}
}

function writable(symbol: ts.Symbol) {
	if (symbol.flags & ts.SymbolFlags.SetAccessor) {
		return true
	}
	return Boolean(
		symbol.flags & ts.SymbolFlags.Property &&
		!symbol.declarations?.some(
			node =>
				ts.getCombinedModifierFlags(node as ts.Declaration) &
				ts.ModifierFlags.Readonly,
		),
	)
}

function lineage(checker: ts.TypeChecker, type: ts.Type): ts.Type[] {
	const bases = type.isClassOrInterface() ? checker.getBaseTypes(type) : []
	return [type, ...bases.flatMap(base => lineage(checker, base))]
}

function eventsOf(checker: ts.TypeChecker, type: ts.Type) {
	const names = lineage(checker, type)
		.flatMap(item => item.getSymbol()?.declarations ?? [])
		.filter(own)
		.flatMap(node => [...node.getText().matchAll(dispatched)].map(match => match[1]))
	return [...new Set(names)]
}

function classOf(file: ts.SourceFile, name: string) {
	return file.statements.find(
		(statement): statement is ts.ClassDeclaration =>
			ts.isClassDeclaration(statement) && statement.name?.text === name,
	)
}

export function apiOf(
	program: ts.Program,
	path: string | null,
	kind: InstanceKind,
): DocApi | null {
	const file = path ? program.getSourceFile(path) : undefined
	const className = path ? basename(path, '.ts') : ''
	const declaration = file ? classOf(file, className) : undefined
	const checker = program.getTypeChecker()
	const symbol = declaration?.name && checker.getSymbolAtLocation(declaration.name)
	if (!symbol) {
		return null
	}
	const type = checker.getDeclaredTypeOfSymbol(symbol)
	return {
		name: deriveInstanceName(className, kind),
		className,
		...membersOf(checker, type, declaration),
		events: eventsOf(checker, type),
	}
}

function membersOf(checker: ts.TypeChecker, type: ts.Type, declaration: ts.Node) {
	const state: DocMember[] = []
	const values: DocMember[] = []
	const methods: DocMethod[] = []
	for (const member of checker.getPropertiesOfType(type).filter(visible)) {
		const origin = originOf(member.declarations?.[0] ?? declaration)
		if (member.flags & ts.SymbolFlags.Method) {
			methods.push(method(checker, member, origin))
			continue
		}
		const entry = {
			...field(checker, member.name, checker.getTypeOfSymbol(member), {
				description: describe(checker, member),
			}),
			...origin,
		}
		;(writable(member) ? values : state).push(entry)
	}
	const first = <T extends Origin>(items: T[]) =>
		items.toSorted((a, b) => Number(a.base) - Number(b.base))
	return { state: first(state), values: first(values), methods: first(methods) }
}

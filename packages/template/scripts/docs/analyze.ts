import { globSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'
import { apiOf } from './api.ts'
import { propsType } from '../../src/components/_conventions/names.ts'
import { sampleSlotsKey } from '../../src/_conventions/names.ts'
import type { Found } from './discover.ts'
import { createProgram, external } from './program.ts'
import { readmeMarks } from './readme.ts'
import type { DocMeta, DocProp, DocsOptions, DocValue } from './types.ts'
import { classify, valueOf } from './values.ts'

const serviceEntries = (base: string) =>
	globSync('src/services/[!_]*/index.ts', { cwd: base }).map(file =>
		resolve(base, file),
	)

function destructured(file: ts.SourceFile) {
	const defaults = new Map<string, string>()
	const collect = (pattern: ts.ObjectBindingPattern) => {
		for (const element of pattern.elements) {
			if (element.initializer && !element.dotDotDotToken) {
				const key = (element.propertyName ?? element.name).getText(file)
				defaults.set(key, element.initializer.getText(file))
			}
		}
	}
	const visit = (node: ts.Node) => {
		if (
			ts.isVariableDeclaration(node) &&
			ts.isObjectBindingPattern(node.name) &&
			node.initializer &&
			/\bprops\b/i.test(node.initializer.getText(file))
		) {
			collect(node.name)
		}
		ts.forEachChild(node, visit)
	}
	visit(file)
	return defaults
}

const isProps = (
	statement: ts.Statement,
): statement is ts.TypeAliasDeclaration | ts.InterfaceDeclaration =>
	(ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) &&
	statement.name.text === propsType

function propSymbols(checker: ts.TypeChecker, file: ts.SourceFile) {
	const declaration = file.statements.find(isProps)
	if (!declaration) {
		return []
	}
	return checker
		.getPropertiesOfType(checker.getTypeAtLocation(declaration.name))
		.filter(symbol =>
			symbol.declarations?.some(node => !external(node.getSourceFile().fileName)),
		)
}

function describe(
	checker: ts.TypeChecker,
	file: ts.SourceFile,
	settings: DocsOptions,
): Pick<DocMeta, 'props' | 'defaults' | 'sampleSlots'> {
	const defaults = destructured(file)
	const symbols = propSymbols(checker, file)
	const props: DocProp[] = []
	const values: Record<string, DocValue> = {}
	for (const symbol of symbols.filter(item => item.name !== sampleSlotsKey)) {
		const type = checker.getTypeOfSymbol(symbol)
		const prop: DocProp = {
			name: symbol.name,
			type: checker.typeToString(checker.getNonNullableType(type)),
			...classify(type),
			optional: Boolean(symbol.flags & ts.SymbolFlags.Optional),
			default: defaults.get(symbol.name) ?? null,
			description: ts.displayPartsToString(symbol.getDocumentationComment(checker)),
		}
		props.push(prop)
		const generated =
			prop.name !== 'class' && (!prop.optional || prop.kind === 'string')
				? valueOf(type, { checker, settings, depth: 0 })
				: undefined
		if (generated !== undefined) {
			values[prop.name] = generated
		}
	}
	return {
		props,
		defaults: values,
		sampleSlots: symbols.some(symbol => symbol.name === sampleSlotsKey),
	}
}

const declaresProps = new RegExp(`\\b(?:type|interface)\\s+${propsType}\\b`)

const withDefault = (frontmatter: string) =>
	`${frontmatter}\ndeclare const docsComponent: (props: ${declaresProps.test(frontmatter) ? propsType : 'Record<string, never>'}) => unknown\nexport default docsComponent\n`

export function analyze(base: string, found: Found[], settings: DocsOptions): DocMeta[] {
	const files = new Map(
		found.map(item => [`${item.astro}.ts`, withDefault(item.frontmatter)]),
	)
	const classes = found
		.flatMap(item => [item.instance, item.manager])
		.filter(path => path !== null)
	const program = createProgram(base, files, [...classes, ...serviceEntries(base)])
	const checker = program.getTypeChecker()
	return found.map(
		({ id, title, layer, full, group, slots, astro, readme, instance, manager }) => {
			const file = program.getSourceFile(`${astro}.ts`)
			const empty = { props: [], defaults: {}, sampleSlots: false }
			return {
				id,
				title,
				layer,
				full,
				group,
				slots,
				source: astro,
				...readmeMarks(readme),
				instance: apiOf(program, instance, 'instance'),
				manager: apiOf(program, manager, 'manager'),
				...(file ? describe(checker, file, settings) : empty),
			}
		},
	)
}

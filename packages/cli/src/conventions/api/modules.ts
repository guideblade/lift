import { existsSync, readFileSync } from 'node:fs'
import type {
	ExportNamedDeclaration,
	ImportDeclaration,
	ModuleExportName,
} from 'oxc-parser'
import { exportedClass, superName } from './ast.ts'
import { describeArg, resolve, show } from './pattern.ts'
import { Script, squash } from './script.ts'
import type { Arg, Check, Scope } from './types.ts'
import { violation } from './violation.ts'
import { fits, text, withScript } from './with-script.ts'

const exportName = (name: ModuleExportName) =>
	name.type === 'Identifier' ? name.name : String(name.value)

export const reexports = (file: Arg<string>, name: string, from: Arg<string>): Check => ({
	id: 'reexports',
	description: `${describeArg(file, show)} has \`export { ${name} } from ${describeArg(from, show)}\``,
	run: withScript('reexports', file, (script, scope) => {
		const source = resolve(from, scope)
		const found = script.find<ExportNamedDeclaration>(
			'ExportNamedDeclaration',
			node =>
				node.source?.value === source &&
				node.specifiers.some(
					item =>
						exportName(item.local) === name &&
						exportName(item.exported) === name,
				),
		)
		return found.length > 0
			? []
			: [
					violation(
						'reexports',
						script.file,
						`missing \`export { ${name} } from '${source}'\``,
					),
				]
	}),
})

function scriptsOf(scope: Scope, file: string): Lift.Script[] {
	const astro = file.endsWith('.astro') ? scope.astro(file) : null
	if (astro) {
		return astro.elements('script').map(node => astro.script(node))
	}
	const script = scope.ts(file)
	return script ? [script] : []
}

export const imports = (file: Arg<string>, from: Arg<string>): Check => ({
	id: 'imports',
	description: `${describeArg(file, show)} imports ${describeArg(from, show)}`,
	run: scope => {
		const path = resolve(file, scope)
		const source = resolve(from, scope)
		if (!scope.has(path)) {
			return []
		}
		const found = scriptsOf(scope, path).some(
			script =>
				script.find<ImportDeclaration>(
					'ImportDeclaration',
					node => node.source.value === source,
				).length > 0,
		)
		return found
			? []
			: [violation('imports', scope.path(path), `add \`import '${source}'\``)]
	},
})

export const endsWith = (file: Arg<string>, statement: Arg<string>): Check => ({
	id: 'endsWith',
	description: `${describeArg(file, show)} ends with ${describeArg(statement, show)}`,
	run: withScript('endsWith', file, (script, scope) => {
		const expected = resolve(statement, scope)
		const last = script.program.body.at(-1)
		return last && script.text(last) === squash(expected)
			? []
			: [
					violation(
						'endsWith',
						script.file,
						`the file must end with \`${expected}\``,
						script.line(last),
					),
				]
	}),
})

type Via = (parent: string, scope: Scope) => string | null

function parentOf(parent: string | null, via: Via | undefined, scope: Scope) {
	const file = parent && via ? via(parent, scope) : null
	if (!parent || !file || !existsSync(file)) {
		return null
	}
	return exportedClass(new Script(file, readFileSync(file, 'utf8')), parent)
}

export const extendsClass = (
	file: Arg<string>,
	name: Arg<string>,
	base: Arg<string | RegExp>,
	options: { via?: Via } = {},
): Check => ({
	id: 'extendsClass',
	description: `${describeArg(name, show)} in ${describeArg(file, show)} extends ${describeArg(base, text)}${options.via ? ' (directly or through its parent)' : ''}`,
	run: withScript('extendsClass', file, (script, scope) => {
		const className = resolve(name, scope)
		const expected = resolve(base, scope)
		const found = exportedClass(script, className)
		const heritage = (item: typeof found, from: Lift.Script) =>
			item?.superClass
				? `${from.text(item.superClass)}${item.superTypeArguments ? from.text(item.superTypeArguments) : ''}`
				: null
		const parent = parentOf(superName(found), options.via, scope)
		const direct = fits(heritage(found, script), expected, scope)
		const inherited =
			parent !== null &&
			superName(parent) !== null &&
			fits(superName(parent), expected, scope)
		return direct || inherited
			? []
			: [
					violation(
						'extendsClass',
						script.file,
						`declare \`export class ${className} extends ${text(expected)}\``,
						script.line(found ?? undefined),
					),
				]
	}),
})

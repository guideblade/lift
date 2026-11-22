import type { TSInterfaceDeclaration, TSTypeAliasDeclaration } from 'oxc-parser'
import { inlined, typeReferences } from './ast.ts'
import { describeArg, resolve, show } from './pattern.ts'
import type { Arg, Check } from './types.ts'
import { violation } from './violation.ts'
import { fits, text, withScript } from './with-script.ts'

export const declares = (
	file: Arg<string>,
	name: string,
	value: Arg<string | RegExp>,
): Check => ({
	id: 'declares',
	description: `${describeArg(file, show)} declares \`const ${name} = ${describeArg(value, text)}\``,
	run: withScript('declares', file, (script, scope) => {
		const expected = resolve(value, scope)
		return fits(inlined(script, name), expected, scope)
			? []
			: [
					violation(
						'declares',
						script.file,
						`declare \`const ${name} = ${text(expected)}\``,
						script.line(),
					),
				]
	}),
})

export const declaresType = (file: Arg<string>, name: string): Check => ({
	id: 'declaresType',
	description: `${describeArg(file, show)} declares exactly one \`type ${name} = …\``,
	run: withScript('declaresType', file, script => {
		const named = (node: { id: { name: string } }) => node.id.name === name
		const interfaces = script.find<TSInterfaceDeclaration>(
			'TSInterfaceDeclaration',
			named,
		)
		const aliases = script.find<TSTypeAliasDeclaration>(
			'TSTypeAliasDeclaration',
			named,
		)
		const found = interfaces.map(node =>
			violation(
				'declaresType',
				script.file,
				`${name} must be \`type ${name} = …\`, not an interface`,
				script.line(node),
			),
		)
		if (aliases.length + interfaces.length === 0) {
			found.push(
				violation(
					'declaresType',
					script.file,
					`missing \`type ${name}\``,
					script.line(),
				),
			)
		}
		if (aliases.length > 1) {
			const message = `${name} is declared more than once`
			found.push(
				violation('declaresType', script.file, message, script.line(aliases[1])),
			)
		}
		return found
	}),
})

export const typeIncludes = (
	file: Arg<string>,
	type: string,
	reference: Arg<string | RegExp>,
): Check => ({
	id: 'typeIncludes',
	description: `\`${type}\` in ${describeArg(file, show)} includes ${describeArg(reference, text)}`,
	run: withScript('typeIncludes', file, (script, scope) => {
		const expected = resolve(reference, scope)
		return typeReferences(script, type).some(ref =>
			fits(script.text(ref), expected, scope),
		)
			? []
			: [
					violation(
						'typeIncludes',
						script.file,
						`\`${type}\` must include \`${text(expected)}\``,
						script.line(),
					),
				]
	}),
})

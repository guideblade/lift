import { join } from 'node:path'
import type { Argument, Expression, ExportDefaultDeclaration } from 'oxc-parser'
import { lift } from './lift.ts'
import { conventionsEntry, conventionsFolder } from './names.ts'

const entry = join(conventionsFolder, conventionsEntry)
const shape =
	'default-export `rules(family(family.rule(), family.rule.off(), …), …)` and nothing else'

const unwrap = (node: Expression): Expression =>
	node.type === 'TSSatisfiesExpression' || node.type === 'ParenthesizedExpression'
		? unwrap(node.expression)
		: node

const calleeName = (node: Argument | undefined) =>
	node?.type === 'CallExpression' && node.callee.type === 'Identifier'
		? node.callee.name
		: null

function isRuleCall(node: Argument, family: string) {
	if (node.type !== 'CallExpression' || node.callee.type !== 'MemberExpression') {
		return false
	}
	const target = node.callee.object
	if (target.type === 'Identifier') {
		return target.name === family
	}
	return (
		target.type === 'MemberExpression' &&
		target.object.type === 'Identifier' &&
		target.object.name === family &&
		node.callee.property.type === 'Identifier' &&
		node.callee.property.name === 'off' &&
		node.arguments.length === 0
	)
}

function groupProblem(node: Argument): string | null {
	const family = calleeName(node)
	if (!family || node.type !== 'CallExpression') {
		return 'every argument of `rules()` is a family call like `props(…)`'
	}
	const loose = node.arguments.filter(item => !isRuleCall(item, family))
	return loose.length > 0
		? `\`${family}(…)\` holds only \`${family}.<rule>(…)\` or \`${family}.<rule>.off()\``
		: null
}

function rulesCall(node: ExportDefaultDeclaration['declaration'] | undefined) {
	const call =
		!node || node.type === 'FunctionDeclaration' ? null : unwrap(node as Expression)
	return call?.type === 'CallExpression' && calleeName(call) === 'rules' ? call : null
}

function problemsOf(
	node: ExportDefaultDeclaration['declaration'] | undefined,
	required: readonly string[],
): string[] {
	const call = rulesCall(node)
	if (!call) {
		return [`${conventionsEntry} must ${shape}`]
	}
	const shaped = call.arguments.map(groupProblem).filter(item => item !== null)
	const listed = new Set(call.arguments.map(calleeName))
	const missing = required
		.filter(name => !listed.has(name))
		.map(
			name =>
				`list \`${name}(…)\`; this kind of folder lists ${required.map(item => `\`${item}\``).join(', ')}`,
		)
	return [...shaped, ...missing]
}

export function checkEntry(
	scope: Lift.Scope,
	required: readonly string[] = [],
): Lift.Violation[] {
	const script = scope.ts(entry)
	if (!script) {
		return []
	}
	const [found] = script.find<ExportDefaultDeclaration>('ExportDefaultDeclaration')
	return problemsOf(found?.declaration, required).map(problem =>
		lift.violation('indexShape', scope.path(entry), problem, script.line(found)),
	)
}

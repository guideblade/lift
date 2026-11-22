import { describeArg, isKind, matches, resolve, showAll } from './pattern.ts'
import type { Arg, Check, Kind, Pattern } from './types.ts'
import { violation } from './violation.ts'

export const allowedItems = (kind: Kind, patterns: Arg<readonly Pattern[]>): Check => ({
	id: 'allowedItems',
	description: `only these ${kind}s: ${describeArg(patterns, showAll)}`,
	run: scope => {
		const allowed = resolve(patterns, scope)
		return scope
			.entries()
			.filter(entry => isKind(entry, kind))
			.filter(
				entry => !allowed.some(pattern => matches(entry.name, pattern, scope)),
			)
			.map(entry =>
				violation(
					'allowedItems',
					scope.path(entry.name),
					`unexpected ${kind}; allowed: ${showAll(allowed)}`,
				),
			)
	},
})

export const requiredItems = (kind: Kind, names: Arg<readonly string[]>): Check => ({
	id: 'requiredItems',
	description: `required ${kind}s: ${describeArg(names, showAll)}`,
	run: scope => {
		const entries = scope.entries()
		return resolve(names, scope)
			.filter(
				name =>
					!entries.some(entry => isKind(entry, kind) && entry.name === name),
			)
			.map(name =>
				violation(
					'requiredItems',
					scope.dir,
					`missing required ${kind} \`${name}\``,
				),
			)
	},
})

import type { Violation } from '../types.ts'
import { isKind, matches, show } from './pattern.ts'
import type { Check, Pattern, Scope } from './types.ts'

export const check = (
	id: string,
	description: string,
	run: (scope: Scope) => Violation[],
): Check => ({ id, description, run })

const runAll = (checks: readonly Check[], scope: Scope) =>
	checks.flatMap(item => item.run(scope))

export const conventions = (...checks: Check[]) => checks

export const each = (pattern: Pattern, ...checks: Check[]): Check => ({
	id: 'each',
	description: `each folder ${show(pattern)}`,
	inner: () => checks,
	run: scope =>
		scope
			.entries()
			.filter(
				entry => isKind(entry, 'folder') && matches(entry.name, pattern, scope),
			)
			.filter(entry => scope.inFocus(scope.path(entry.name)))
			.flatMap(entry => runAll(checks, scope.child(entry.name))),
})

export const when = (
	predicate: (scope: Scope) => boolean,
	...checks: Check[]
): Check => ({
	id: 'when',
	description: `when <${predicate.name || 'custom'}>`,
	inner: () => checks,
	run: scope => (predicate(scope) ? runAll(checks, scope) : []),
})

export const unless = (
	predicate: (scope: Scope) => boolean,
	...checks: Check[]
): Check => ({
	id: 'unless',
	description: `unless <${predicate.name || 'custom'}>`,
	inner: () => checks,
	run: scope => (predicate(scope) ? [] : runAll(checks, scope)),
})

export const preset = (name: string, build: () => Check[]): Check => {
	let built: Check[] | null = null
	const inner = () => {
		built ??= build()
		return built
	}
	return {
		id: name,
		description: name,
		inner,
		run: scope => runAll(inner(), scope),
	}
}

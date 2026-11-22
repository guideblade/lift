import type { Violation } from '../types.ts'
import { matches, resolve } from './pattern.ts'
import { squash } from './script.ts'
import type { Arg, Scope } from './types.ts'
import { violation } from './violation.ts'

export const withScript =
	(
		id: string,
		file: Arg<string>,
		run: (script: Lift.Script, scope: Scope) => Violation[],
	) =>
	(scope: Scope): Violation[] => {
		const path = resolve(file, scope)
		const script = scope.script(path)
		if (script === undefined) {
			return []
		}
		return script
			? run(script, scope)
			: [violation(id, scope.path(path), 'missing frontmatter', 1)]
	}

export const text = (pattern: string | RegExp) =>
	typeof pattern === 'string' ? pattern : String(pattern)

export const fits = (value: string | null, pattern: string | RegExp, scope: Scope) =>
	value !== null &&
	matches(value, typeof pattern === 'string' ? squash(pattern) : pattern, scope)

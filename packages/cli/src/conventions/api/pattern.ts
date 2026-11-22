import type { Dirent } from 'node:fs'
import type { Arg, Kind, Pattern, Scope } from './types.ts'

export const resolve = <T>(arg: Arg<T>, scope: Scope): T =>
	typeof arg === 'function' ? (arg as (scope: Scope) => T)(scope) : arg

export const show = (pattern: Pattern) => {
	if (typeof pattern === 'function') {
		return `<${pattern.name || 'custom'}>`
	}
	return `\`${typeof pattern === 'string' ? pattern : String(pattern)}\``
}

export const showAll = (patterns: readonly Pattern[]) =>
	patterns.length > 0 ? patterns.map(show).join(', ') : 'none'

export const matches = (name: string, pattern: Pattern, scope: Scope) => {
	if (typeof pattern === 'string') {
		return name === pattern
	}
	return pattern instanceof RegExp ? pattern.test(name) : pattern(name, scope)
}

export const isKind = (entry: Dirent, kind: Kind) =>
	kind === 'folder' ? entry.isDirectory() : entry.isFile()

export const describeArg = <T>(arg: Arg<T>, render: (value: T) => string) =>
	typeof arg === 'function' ? `<${arg.name || 'derived'}>` : render(arg)

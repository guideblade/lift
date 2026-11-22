import { lift } from './lift.ts'
import { conventionsEntry, conventionsFolder } from './names.ts'
import { checkEntry } from './toggles.ts'

const ownsConventions = (scope: Lift.Scope) =>
	scope.has(conventionsFolder, conventionsEntry)

export const localFiles = (scope: Lift.Scope, pattern: RegExp) =>
	scope
		.entries()
		.filter(entry => !entry.isDirectory() && pattern.test(entry.name))
		.map(entry => entry.name)

const matches = (pattern: Lift.Pattern, name: string, scope: Lift.Scope) => {
	if (typeof pattern === 'string') {
		return pattern === name
	}
	return pattern instanceof RegExp ? pattern.test(name) : pattern(name, scope)
}

const missing = (scope: Lift.Scope, name: string) =>
	lift.violation(
		'ownConventions',
		scope.path(name),
		`add \`${conventionsFolder}/${conventionsEntry}\`; a folder runs its own conventions, so its parent never checks inside it`,
	)

type Owned = readonly [pattern: Lift.Pattern, families: readonly string[]]

export const ownConventions =
	(...owned: Owned[]) =>
	(scope: Lift.Scope): Lift.Violation[] =>
		scope
			.entries()
			.filter(entry => entry.isDirectory())
			.flatMap(entry => {
				const found = owned.find(([pattern]) =>
					matches(pattern, entry.name, scope),
				)
				if (!found) {
					return []
				}
				const child = scope.child(entry.name)
				return ownsConventions(child)
					? checkEntry(child, found[1])
					: [missing(scope, entry.name)]
			})

import { join } from 'node:path'
import type { CallExpression } from 'oxc-parser'
import { lift } from '@/_conventions/lift.ts'
import {
	blueprintsFolder,
	commandsFolder,
	conventionsEntry,
	conventionsFolder,
	groupFolder,
} from '@/_conventions/names.ts'
import { ownConventions } from '@/_conventions/owner.ts'
import { family, rule } from '@/_conventions/rules.ts'
import { blueprintsFamilies, groupFamilies } from './families.ts'
import { groupPlacement } from './group.ts'
import { isInstance } from './instance.ts'
import {
	astroFile,
	htmlTags,
	instanceFiles,
	kebab,
	requiredRootFiles,
	requiredRootFolders,
	rootFiles,
	rootFolders,
	uiAstroFile,
} from './names.ts'

function nestedComponent(name: string, scope: Lift.Scope) {
	return (
		!rootFolders.includes(name) &&
		scope.entries(name).some(entry => entry.isDirectory() && entry.name === 'ui')
	)
}

const componentFolders = (scope: Lift.Scope) => [
	...rootFolders,
	...scope
		.entries()
		.filter(entry => entry.isDirectory() && nestedComponent(entry.name, scope))
		.map(entry => entry.name),
]

const componentFiles = (scope: Lift.Scope) => [
	...rootFiles,
	...(isInstance(scope) ? instanceFiles(scope.pascal) : []),
]

const astroEntry = (scope: Lift.Scope) => `./${astroFile(scope)}`

const listsInstance = (scope: Lift.Scope) =>
	(scope
		.ts(join(conventionsFolder, conventionsEntry))
		?.find<CallExpression>(
			'CallExpression',
			node => node.callee.type === 'Identifier' && node.callee.name === 'instance',
		).length ?? 0) > 0

const plainTag = (scope: Lift.Scope): Lift.Violation[] =>
	isInstance(scope) && htmlTags.has(scope.name)
		? [
				lift.violation(
					'plainTag',
					scope.dir,
					`<${scope.name}> is an HTML tag, so its component is plain; build the enhanced control as a kit instance on a behavior`,
				),
			]
		: []

function instanceFamily(scope: Lift.Scope): Lift.Violation[] {
	const wanted = isInstance(scope)
	if (wanted === listsInstance(scope)) {
		return []
	}
	const message = wanted
		? 'this is an instance component; list `instance(…)` with every instance rule'
		: 'this is a plain component; remove `instance(…)`'
	return [
		lift.violation(
			'instanceFamily',
			scope.path(conventionsFolder, conventionsEntry),
			message,
		),
	]
}

export const structure = family('structure', {
	requiredFiles: rule('the component has `index.ts`; `README.md` is optional', () =>
		lift.requiredItems('file', requiredRootFiles),
	),
	requiredFolders: rule('the component has a `ui` folder', () =>
		lift.requiredItems('folder', requiredRootFolders),
	),
	allowedFiles: rule(
		'the component holds only `README.md`, `index.ts` and its instance files',
		() => lift.allowedItems('file', componentFiles),
	),
	allowedFolders: rule(
		'the component holds only `ui`, `model`, `lib`, `samples`, `tests`, `other`, `_generated`, `_commands` and nested components',
		() => lift.allowedItems('folder', componentFolders),
	),
	indexReexport: rule('`index.ts` re-exports `ui/<Name>.astro` as default', () =>
		lift.reexports('index.ts', 'default', astroEntry),
	),
	plainTag: rule('a component named after an HTML tag is plain', () => plainTag),
	instanceFamily: rule(
		'an instance component lists `instance(…)` in its conventions, a plain one does not',
		() => instanceFamily,
	),
	nestedConventions: rule(
		'every nested component runs its own `_conventions/index.ts`',
		(members: readonly string[]) => ownConventions([nestedComponent, members]),
	),
})

export const uiStructure = family('structure', {
	parses: rule('`ui/<Name>.astro` parses', () => lift.parses(uiAstroFile)),
})

export const layerRoot = family('layerRoot', {
	allowedFolders: rule(
		'a component layer holds only groups, components, `_commands` and `_blueprints`',
		() =>
			lift.allowedItems('folder', [
				groupFolder,
				kebab,
				commandsFolder,
				blueprintsFolder,
			]),
	),
	groupPlacement: rule(
		'a folder whose name belongs to a sibling group sits in that group',
		() => groupPlacement,
	),
	ownConventions: rule(
		'every group, component and `_blueprints` runs its own `_conventions/index.ts`',
		(members: readonly string[]) =>
			ownConventions(
				[groupFolder, groupFamilies],
				[kebab, members],
				[blueprintsFolder, blueprintsFamilies],
			),
	),
})

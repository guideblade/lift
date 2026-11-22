import { sep } from 'node:path'
import { lift } from '@/_conventions/lift.ts'
import { family, rule } from '@/_conventions/rules.ts'
import { groupFamilies } from './families.ts'
import { groupFolder } from '@/_conventions/names.ts'
import { groupFor, groupPrefix, isGroup, isKebab } from './names.ts'
import { ownConventions } from '@/_conventions/owner.ts'

function notGroup(name: string) {
	return !isGroup(name)
}

function groupPath(scope: Lift.Scope) {
	const parts = scope.dir.split(sep)
	const at = parts.findLastIndex(part => !isGroup(part))
	return parts.slice(at + 1).reduce(groupPrefix, '')
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const prefixed = (scope: Lift.Scope) =>
	new RegExp(`^${escape(groupPath(scope))}(-[a-z0-9]+)*$`)

const folders = (scope: Lift.Scope) =>
	scope
		.entries()
		.filter(entry => entry.isDirectory())
		.map(entry => entry.name)

export const groupPlacement = (scope: Lift.Scope): Lift.Violation[] => {
	const names = folders(scope)
	return names.filter(isKebab).flatMap(name => {
		const group = groupFor(groupPath(scope), names, name)
		return group
			? [
					lift.violation(
						'groupPlacement',
						scope.path(name),
						`\`${name}\` belongs in \`${group}\``,
					),
				]
			: []
	})
}

export const group = family('group', {
	allowedFiles: rule('a group holds no files', () => lift.allowedItems('file', [])),
	allowedFolders: rule(
		'a group holds only nested groups and folders named with its prefix',
		() =>
			lift.allowedItems('folder', function groupMembers(scope) {
				return [groupFolder, prefixed(scope)]
			}),
	),
	placement: rule(
		'a folder whose name belongs to a sibling group sits in that group',
		() => groupPlacement,
	),
	ownConventions: rule(
		'every member runs its own `_conventions/index.ts`, listing the families its kind needs',
		(members: readonly string[]) =>
			ownConventions([groupFolder, groupFamilies], [notGroup, members]),
	),
})

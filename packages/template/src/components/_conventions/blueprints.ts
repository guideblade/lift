import { lift } from '@/_conventions/lift.ts'
import { ownConventions } from '@/_conventions/owner.ts'
import { family, rule } from '@/_conventions/rules.ts'
import { variantFamilies } from './families.ts'
import { blueprintName, blueprintVariants } from './names.ts'

export const blueprints = family('blueprints', {
	allowedFiles: rule('`_blueprints` holds only `README.md`', () =>
		lift.allowedItems('file', ['README.md']),
	),
	allowedFolders: rule('`_blueprints` holds only `plain` and `instance`', () =>
		lift.allowedItems('folder', blueprintVariants),
	),
	ownConventions: rule(
		'each blueprint variant runs its own `_conventions/index.ts`',
		() =>
			ownConventions(
				...blueprintVariants.map(name => [name, variantFamilies] as const),
			),
	),
})

export const blueprintVariant = family('blueprintVariant', {
	allowedFiles: rule('a blueprint variant holds no files', () =>
		lift.allowedItems('file', []),
	),
	allowedFolders: rule('a blueprint variant holds only `component`', () =>
		lift.allowedItems('folder', [blueprintName]),
	),
	requiredFolders: rule('a blueprint variant has `component`', () =>
		lift.requiredItems('folder', [blueprintName]),
	),
	ownConventions: rule(
		'the blueprint component runs its own `_conventions/index.ts`',
		(members: readonly string[]) => ownConventions([blueprintName, members]),
	),
})

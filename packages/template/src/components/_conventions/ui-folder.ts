import { lift } from '@/_conventions/lift.ts'
import { family, rule } from '@/_conventions/rules.ts'
import { uiComponentName, uiFiles, uiFolders, variants } from './names.ts'

const componentUiFiles = (scope: Lift.Scope) =>
	uiFiles(uiComponentName(scope), lift.toPascal(uiComponentName(scope)))

function contiguousVariants(scope: Lift.Scope) {
	const names = scope
		.entries()
		.filter(entry => entry.isFile() && entry.name.endsWith('.scss'))
		.map(entry => entry.name.slice(0, -'.scss'.length))
	const gaps = variants
		.slice(0, Math.max(names.length, 1))
		.filter(name => !names.includes(name))
	return gaps.length > 0
		? [
				lift.violation(
					'contiguousVariants',
					scope.dir,
					`variants must be contiguous from primary; missing ${gaps.join(', ')}`,
				),
			]
		: []
}

export const ui = family('ui', {
	requiredFiles: rule(
		'`ui` has `<Name>.astro`, `<name>.scss`, `shared.scss` and `mixins.scss`',
		() => lift.requiredItems('file', componentUiFiles),
	),
	requiredFolders: rule('`ui` has a `variant` folder', () =>
		lift.requiredItems('folder', uiFolders),
	),
	allowedFiles: rule('`ui` holds only its four files', () =>
		lift.allowedItems('file', componentUiFiles),
	),
	allowedFolders: rule('`ui` holds only the `variant` folder', () =>
		lift.allowedItems('folder', uiFolders),
	),
})

export const variant = family('ui', {
	variantFiles: rule('`variant` holds only `primary.scss`, `secondary.scss`, …', () =>
		lift.allowedItems(
			'file',
			variants.map(name => `${name}.scss`),
		),
	),
	variantFolders: rule('`variant` holds no folders', () =>
		lift.allowedItems('folder', []),
	),
	contiguousVariants: rule('variants run from primary without gaps', () =>
		lift.check('contiguousVariants', 'contiguousVariants', contiguousVariants),
	),
})

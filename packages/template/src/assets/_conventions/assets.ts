import { lift } from '@/_conventions/lift.ts'
import { groupFolder } from '@/_conventions/names.ts'
import { ownConventions } from '@/_conventions/owner.ts'
import { family, rule } from '@/_conventions/rules.ts'

export const assets = family('assets', {
	allowedFolders: rule('assets holds only groups like `(icon)`', () =>
		lift.allowedItems('folder', [groupFolder]),
	),
	allowedFiles: rule('assets holds no loose files', () =>
		lift.allowedItems('file', []),
	),
	ownConventions: rule(
		'`(icon)` and `(image)` run their own `_conventions/index.ts`',
		() =>
			ownConventions(
				['(icon)', ['icons', 'layer', 'folder']],
				['(image)', ['images', 'layer', 'folder']],
			),
	),
})

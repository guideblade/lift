import { lift } from '@/_conventions/lift.ts'
import { commandsFolder } from '@/_conventions/names.ts'
import { family, rule } from '@/_conventions/rules.ts'

const icon = /^icon-[a-z0-9]+(-[a-z0-9]+)*\.svg$/

export const icons = family('icons', {
	allowedFiles: rule('files are named `icon-<name>.svg`', () =>
		lift.allowedItems('file', [icon]),
	),
	allowedFolders: rule('the only folder is `_commands`', () =>
		lift.allowedItems('folder', [commandsFolder]),
	),
})

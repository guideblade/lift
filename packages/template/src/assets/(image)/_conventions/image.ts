import { lift } from '@/_conventions/lift.ts'
import { commandsFolder } from '@/_conventions/names.ts'
import { family, rule } from '@/_conventions/rules.ts'

const image = /^image-[a-z0-9]+(-[a-z0-9]+)*@[a-z]+@\d+\.(jpg|png)$/

export const images = family('images', {
	allowedFiles: rule('files are named `image-<name>@<phase>@<scale>.jpg or .png`', () =>
		lift.allowedItems('file', [image]),
	),
	allowedFolders: rule('the only folder is `_commands`', () =>
		lift.allowedItems('folder', [commandsFolder]),
	),
})

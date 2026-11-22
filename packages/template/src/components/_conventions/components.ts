import { lift } from '@/_conventions/lift.ts'
import { commandsFolder } from '@/_conventions/names.ts'
import { ownConventions } from '@/_conventions/owner.ts'
import { family, rule } from '@/_conventions/rules.ts'
import { layerRootFamilies } from './families.ts'

const layers = ['primitives', 'blocks', 'presets', 'widgets']

export const components = family('components', {
	allowedFolders: rule('`components` holds only its four layers and `_commands`', () =>
		lift.allowedItems('folder', [...layers, commandsFolder]),
	),
	allowedFiles: rule('`components` holds only `README.md`', () =>
		lift.allowedItems('file', ['README.md']),
	),
	ownConventions: rule(
		'each component layer runs its own `_conventions/index.ts`',
		() => ownConventions(...layers.map(name => [name, layerRootFamilies] as const)),
	),
})

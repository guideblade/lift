import {
	conventionImports,
	conventionsIndex,
	definitionPlacement,
} from './definitions.ts'
import { layerImports } from './imports.ts'
import { lift } from './lift.ts'
import { commandsFolder } from './names.ts'
import { ownConventions } from './owner.ts'
import { family, rule } from './rules.ts'
import { serviceImports } from './services.ts'
import { checkEntry } from './toggles.ts'

const layerFamilies = ['layer', 'folder'] as const

const rootFamilies = {
	site: ['site', 'folder'],
	libs: layerFamilies,
	behaviors: layerFamilies,
	services: layerFamilies,
	assets: ['assets', ...layerFamilies],
	components: ['components', 'folder'],
	pages: layerFamilies,
}

export const folder = family('folder', {
	serviceImports: rule(
		'nothing imports a service folder; scripts reach services through `@services` and Sass through `services:proxy`, so deleting a folder removes its service',
		() => serviceImports,
	),
	conventionsIndex: rule(
		'`_conventions/index.ts` only default-exports the folder’s rules, and nothing imports it',
		() => conventionsIndex,
	),
	conventionImports: rule(
		'files in `_conventions` import conventions only from their own folder and the folders above',
		() => conventionImports,
	),
	definitionPlacement: rule(
		'every export of a `_conventions` file is used, and lives in the closest folder above everything that uses it',
		() => definitionPlacement,
	),
})

export const layer = family('layer', {
	imports: rule(
		'files import only from the layers this layer allows, never from a blueprint',
		(mayImport: readonly string[]) => layerImports(mayImport),
	),
})

export const srcRoot = family('srcRoot', {
	allowedFolders: rule(
		'src holds only its source folders, `content`, and shared `_commands`',
		() =>
			lift.allowedItems('folder', [
				...Object.keys(rootFamilies),
				'content',
				commandsFolder,
			]),
	),
	ownConventions: rule(
		'every top-level folder runs its own `_conventions/index.ts`, written as family calls',
		() => ownConventions(...Object.entries(rootFamilies)),
	),
	indexShape: rule(
		'src’s own `_conventions/index.ts` is written as family calls',
		() => checkEntry,
	),
})

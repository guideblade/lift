import { existsSync, readdirSync } from 'node:fs'
import { basename, relative, resolve } from 'node:path'
import { config } from '../../../../site/config/site.config.ts'
import { registryCode } from './photoModule.ts'
import {
	BARREL_FILE,
	GLOBAL_REGISTRY,
	IMAGE_DIR,
	LOCAL_FOLDER,
	parseImageFilename,
	REGISTRY_FILE,
	SOURCE_FORMATS,
	SOURCE_SCALES,
} from './photoValidator.ts'

export type PhotoScope = { id: string; dir: string; registry: string; local: boolean }

const scopeId = (root: string, dir: string) => relative(root, dir).replace(/\\/g, '/')

export function photoScopes(root: string): PhotoScope[] {
	const globalDir = resolve(root, IMAGE_DIR)
	const [parent, folder] = LOCAL_FOLDER
	const local = readdirSync(resolve(root, 'src'), {
		recursive: true,
		withFileTypes: true,
	})
		.filter(
			entry =>
				entry.isDirectory() &&
				entry.name === folder &&
				basename(entry.parentPath) === parent,
		)
		.map(entry => resolve(entry.parentPath, entry.name))
	return [
		{
			id: scopeId(root, globalDir),
			dir: globalDir,
			registry: resolve(root, GLOBAL_REGISTRY),
			local: false,
		},
		...local.map(dir => ({
			id: scopeId(root, dir),
			dir,
			registry: resolve(dir, REGISTRY_FILE),
			local: true,
		})),
	]
}

export function photoNames(dir: string) {
	if (!existsSync(dir)) {
		return []
	}
	const phases = Object.keys(config.devices)
	const names = readdirSync(dir, { withFileTypes: true })
		.filter(
			entry =>
				entry.isFile() &&
				!entry.name.startsWith('.') &&
				entry.name !== BARREL_FILE,
		)
		.map(
			entry =>
				parseImageFilename(entry.name, {
					phases,
					extensions: SOURCE_FORMATS,
					scales: SOURCE_SCALES,
				}).name,
		)
	return [...new Set(names)].sort()
}

export function photoFiles(root: string) {
	return photoScopes(root).flatMap(scope => [
		{
			path: scope.registry,
			source: scope.dir,
			content: registryCode(scope.id, photoNames(scope.dir), scope.local),
		},
		...(scope.local
			? [
					{
						path: resolve(scope.dir, BARREL_FILE),
						source: scope.dir,
						content: `export { default } from './${REGISTRY_FILE}'\n`,
					},
				]
			: []),
	])
}

import { existsSync } from 'node:fs'
import { mkdir, readdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { config } from '../../../../site/config/site.config.ts'
import {
	collectGroups,
	planGroup,
	renderGroup,
	type PhaseModel,
} from './photoGenerator.ts'
import { photoScopes } from './photoFiles.ts'
import { virtualModuleCode, type ScopeModel } from './photoModule.ts'
import { CACHE_DIR } from './photoValidator.ts'

const VIRTUAL_ID = 'virtual:lift-photos'
const RESOLVED_ID = `\0${VIRTUAL_ID}`

interface ModuleGraph {
	getModuleById(id: string): unknown
	invalidateModule(module: unknown): void
}

const existingScopes = (root: string) =>
	photoScopes(root).filter(scope => existsSync(scope.dir))

export async function generatePhotos(root = process.cwd()) {
	const cacheDir = resolve(root, CACHE_DIR)
	await mkdir(cacheDir, { recursive: true })

	const cached = new Set(await readdir(cacheDir))
	const phases = Object.keys(config.devices)
	const models: ScopeModel[] = []

	for (const scope of existingScopes(root)) {
		const phaseModels: PhaseModel[] = []
		for (const group of (await collectGroups(scope.dir, phases)).values()) {
			phaseModels.push(await renderGroup(scope.dir, cacheDir, group, cached))
		}
		models.push({ id: scope.id, phases: phaseModels })
	}

	return virtualModuleCode(models, cacheDir)
}

export async function prunePhotos(root = process.cwd()) {
	const cacheDir = resolve(root, CACHE_DIR)
	const phases = Object.keys(config.devices)
	const keep = new Set<string>()

	for (const scope of existingScopes(root)) {
		for (const group of (await collectGroups(scope.dir, phases)).values()) {
			for (const { output } of await planGroup(scope.dir, group)) {
				keep.add(output.file)
			}
		}
	}

	const files = await readdir(cacheDir).catch(() => [])
	const stale = files.filter(file => !keep.has(file))
	await Promise.all(stale.map(file => rm(resolve(cacheDir, file), { force: true })))
	return stale.length
}

export function photoPlugin() {
	const watch =
		/[\\/](?:src[\\/]assets[\\/]\(image\)|media[\\/]photos)[\\/][^\\/]+(?<!\.ts)$/
	let code: Promise<string> | undefined

	const regenerate = () => {
		code = (code ?? Promise.resolve('')).catch(() => '').then(() => generatePhotos())
		return code
	}

	return {
		name: 'photo-generator',
		async buildStart() {
			await regenerate()
		},
		resolveId(id: string) {
			return id === VIRTUAL_ID ? RESOLVED_ID : undefined
		},
		load(id: string) {
			return id === RESOLVED_ID ? (code ?? regenerate()) : undefined
		},
		configureServer(server: {
			watcher: { on(event: 'all', cb: (event: string, file: string) => void): void }
			ws: { send(payload: { type: 'full-reload' }): void }
			config: { logger: { error(message: string): void } }
			environments: Record<string, { moduleGraph: ModuleGraph }>
		}) {
			server.watcher.on('all', (_event, file) => {
				if (!watch.test(file)) {
					return
				}
				regenerate().then(
					() => {
						for (const { moduleGraph } of Object.values(
							server.environments,
						)) {
							const module = moduleGraph.getModuleById(RESOLVED_ID)
							if (module) {
								moduleGraph.invalidateModule(module)
							}
						}
						server.ws.send({ type: 'full-reload' })
					},
					(error: Error) => server.config.logger.error(error.message),
				)
			})
		},
	}
}

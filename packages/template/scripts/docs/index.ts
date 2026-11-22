import { resolve } from 'node:path'
import { primarySample } from '../../src/components/_conventions/names.ts'
import { mayImport as blocks } from '../../src/components/blocks/_conventions/layer.ts'
import { mayImport as presets } from '../../src/components/presets/_conventions/layer.ts'
import { mayImport as primitives } from '../../src/components/primitives/_conventions/layer.ts'
import { mayImport as widgets } from '../../src/components/widgets/_conventions/layer.ts'
import { fileURLToPath } from 'node:url'
import type { AstroIntegration } from 'astro'
import { analyze } from './analyze.ts'
import { discover } from './discover.ts'
import type { DocsOptions } from './types.ts'

const VIRTUAL_ID = 'virtual:lift-docs'
const RESOLVED_ID = `\0${VIRTUAL_ID}`
const watched = /\.(astro|ts|md)$/
const utilitiesModule = fileURLToPath(
	new URL('utilities.ts', import.meta.url),
).replaceAll('\\', '/')

const imports: Record<string, readonly string[]> = {
	'components/primitives': primitives,
	'components/blocks': blocks,
	'components/presets': presets,
	'components/widgets': widgets,
}

const components = Object.keys(imports)

const importedByComponents = (layer: string) =>
	components.some(other => imports[other]?.includes(layer))

export const docsDefaults: Omit<DocsOptions, 'preview'> = {
	roots: Object.fromEntries(
		components.map(layer => [
			layer.split('/').at(-1) ?? layer,
			{ path: `src/${layer}`, full: !importedByComponents(layer) },
		]),
	),
	text: 'Text',
	preferred: primarySample,
}

interface ModuleGraph {
	getModuleById(id: string): unknown
	invalidateModule(module: unknown): void
}

interface Server {
	watcher: { on(event: 'all', cb: (event: string, file: string) => void): void }
	ws: { send(payload: { type: 'full-reload' }): void }
	config: { logger: { error(message: string): void } }
	environments: Record<string, { moduleGraph: ModuleGraph }>
}

const loader = (path: string | null) =>
	path ? `() => import(${JSON.stringify(path)})` : 'null'

function render(base: string, settings: DocsOptions) {
	const found = discover(base, settings.roots)
	const entries = analyze(base, found, settings).map(
		(meta, index) =>
			`\t{ ...${JSON.stringify(meta)}, component: ${loader(meta.source)}, samples: ${loader(found[index].samples)}, readme: ${loader(found[index].readme)} },`,
	)
	return [
		`export { utilities } from ${JSON.stringify(utilitiesModule)}`,
		'export const components = [',
		...entries,
		']',
		'',
	].join('\n')
}

function reload(server: Server) {
	for (const { moduleGraph } of Object.values(server.environments)) {
		const module = moduleGraph.getModuleById(RESOLVED_ID)
		if (module) {
			moduleGraph.invalidateModule(module)
		}
	}
	server.ws.send({ type: 'full-reload' })
}

function docsPlugin(base: string, settings: DocsOptions) {
	const roots = Object.values(settings.roots).map(root => resolve(base, root.path))
	let code: string | undefined
	let timer: ReturnType<typeof setTimeout> | undefined

	const refresh = (server: Server) => {
		try {
			const next = render(base, settings)
			if (code !== undefined && next !== code) {
				code = next
				reload(server)
			}
		} catch (error) {
			server.config.logger.error(String(error))
		}
	}

	return {
		name: 'lift-component-docs',
		resolveId(id: string) {
			return id === VIRTUAL_ID ? RESOLVED_ID : undefined
		},
		load(id: string) {
			if (id !== RESOLVED_ID) {
				return undefined
			}
			code ??= render(base, settings)
			return code
		},
		configureServer(server: Server) {
			server.watcher.on('all', (_event, file) => {
				const path = resolve(file)
				if (watched.test(path) && roots.some(root => path.startsWith(root))) {
					clearTimeout(timer)
					timer = setTimeout(() => refresh(server), 150)
				}
			})
		},
	}
}

export function componentDocs(
	options: Partial<DocsOptions> & Pick<DocsOptions, 'preview'>,
): AstroIntegration {
	const settings = { ...docsDefaults, ...options }
	let dev = false
	return {
		name: 'lift-component-docs',
		hooks: {
			'astro:config:setup': ({ command, config, updateConfig }) => {
				dev = command === 'dev'
				updateConfig({
					vite: { plugins: [docsPlugin(fileURLToPath(config.root), settings)] },
				})
			},
			'astro:route:setup': ({ route }) => {
				if (
					dev &&
					route.component.replaceAll('\\', '/').endsWith(settings.preview)
				) {
					route.prerender = false
				}
			},
		},
	}
}

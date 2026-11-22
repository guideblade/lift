import { existsSync, readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AstroIntegration } from 'astro'

const root = fileURLToPath(new URL('../../src/pages/_dev', import.meta.url))
const routeFile = /\.(astro|md|mdx|html|ts|js)$/

function isRoute(file: string): boolean {
	const path = relative(root, file)
	if (!path || path.startsWith('..')) {
		return false
	}

	return (
		routeFile.test(path) && !path.split(sep).some(segment => segment.startsWith('_'))
	)
}

function collect(dir: string): string[] {
	if (!existsSync(dir)) {
		return []
	}

	return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
		const path = join(dir, entry.name)
		if (entry.name.startsWith('_')) {
			return []
		}
		if (entry.isDirectory()) {
			return collect(path)
		}
		return isRoute(path) ? [path] : []
	})
}

function toPattern(file: string): string {
	const route = relative(root, file)
		.split(sep)
		.join('/')
		.replace(routeFile, '')
		.replace(/(^|\/)index$/, '')

	return `/${route}`
}

export function devRoutes(): string[] {
	return collect(root).map(toPattern)
}

export function devPages(options: { mode: string }): AstroIntegration {
	return {
		name: 'lift-dev-pages',
		hooks: {
			'astro:config:setup': ({ command, injectRoute, addWatchFile }) => {
				if (command !== 'dev' && options.mode === 'production') {
					return
				}

				addWatchFile(root)
				for (const entrypoint of collect(root)) {
					injectRoute({ pattern: toPattern(entrypoint), entrypoint })
				}
			},
			'astro:server:setup': ({ server }) => {
				const restart = (file: string) => {
					if (isRoute(file)) {
						server.watcher.emit('change', root)
					}
				}

				server.watcher.on('add', restart)
				server.watcher.on('unlink', restart)
			},
		},
	}
}

import { existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { AstroIntegration } from 'astro'
import type { PageConfig } from '../../src/libs/page/page-config/pageConfig.ts'
import { pageRoutes } from '../../src/libs/page/page-routes/pageRoutes.ts'

const pages = fileURLToPath(new URL('../../src/pages', import.meta.url))
const nativeImport = new Function('url', 'return import(url)') as (
	url: string,
) => Promise<{ page: PageConfig }>

function configFiles(dir: string, withDev: boolean): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
		const path = join(dir, entry.name)
		if (entry.isFile()) {
			return entry.name === '_page.ts' ? [path] : []
		}
		const dev = dir === pages && entry.name === '_dev'
		return entry.isDirectory() && (!entry.name.startsWith('_') || (dev && withDev))
			? configFiles(path, withDev)
			: []
	})
}

function pagePath(dir: string) {
	return relative(pages, dir)
		.split(sep)
		.filter((segment, index) => !(index === 0 && segment === '_dev'))
		.join('/')
}

export function pageVariants(options: {
	mode: string
	defaultLocale: string
}): AstroIntegration {
	return {
		name: 'lift-page-variants',
		hooks: {
			'astro:config:setup': async ({ command, injectRoute, addWatchFile }) => {
				const withDev = command === 'dev' || options.mode !== 'production'
				addWatchFile(pages)
				for (const file of configFiles(pages, withDev)) {
					const entrypoint = join(dirname(file), 'index.astro')
					addWatchFile(file)
					if (!existsSync(entrypoint)) {
						continue
					}
					const url = `${pathToFileURL(file).href}?t=${statSync(file).mtimeMs}`
					const { page } = await nativeImport(url)
					const path = pagePath(dirname(file))
					for (const { pattern } of pageRoutes(
						path,
						page,
						options.defaultLocale,
					)) {
						if (pattern !== `/${path}`) {
							injectRoute({ pattern, entrypoint })
						}
					}
				}
			},
			'astro:server:setup': ({ server }) => {
				const restart = (file: string) => {
					if (file.endsWith(`${sep}_page.ts`)) {
						server.watcher.emit('change', pages)
					}
				}

				server.watcher.on('add', restart)
				server.watcher.on('unlink', restart)
			},
		},
	}
}

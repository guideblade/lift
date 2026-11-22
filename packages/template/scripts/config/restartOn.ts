import { globSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AstroIntegration } from 'astro'

const project = fileURLToPath(new URL('../..', import.meta.url))

const startupSources = [
	'scripts/**/*.ts',
	'src/site/config/**/*.ts',
	'src/libs/attributes/**/*.ts',
	'src/libs/instance/instance-state/**/*.ts',
	'src/services/build.ts',
	'src/services/*/plugin.ts',
	'src/services/*/sass.ts',
]

const stylesheet = /\.s[ac]ss$/

export function restartOn(): AstroIntegration {
	const files = globSync(startupSources, { cwd: project }).map(file =>
		resolve(project, file),
	)
	return {
		name: 'lift-restart-on',
		hooks: {
			'astro:config:setup': ({ command, addWatchFile }) => {
				if (command === 'dev') {
					files.forEach(file => addWatchFile(file))
				}
			},
			'astro:server:setup': ({ server, logger }) => {
				server.watcher.add(files)
				server.watcher.on('add', file => {
					if (stylesheet.test(file) && files[0]) {
						logger.info(`${file} was added, restarting so Sass can import it`)
						server.watcher.emit('change', files[0])
					}
				})
			},
		},
	}
}

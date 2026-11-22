import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { ICON_SPRITE, iconNames, iconSprite } from './iconFiles.ts'

async function writeSprite(root = process.cwd()) {
	const file = resolve(root, ICON_SPRITE)
	const sprite = iconSprite(root, iconNames(root))
	if ((await readFile(file, 'utf8').catch(() => null)) !== sprite) {
		await mkdir(dirname(file), { recursive: true })
		await writeFile(file, sprite, 'utf8')
	}
}

export function iconPlugin() {
	const watch = /[\\/]src[\\/]assets[\\/]\(icon\)[\\/].+\.svg$/

	return {
		name: 'icon-sprite',
		async buildStart() {
			await writeSprite()
		},
		configureServer(server: {
			watcher: { on(event: 'all', cb: (event: string, file: string) => void): void }
			ws: { send(payload: { type: 'full-reload' }): void }
		}) {
			server.watcher.on('all', async (_event, file) => {
				if (watch.test(file)) {
					await writeSprite()
					server.ws.send({ type: 'full-reload' })
				}
			})
		},
	}
}

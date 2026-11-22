import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { extname, join, resolve } from 'node:path'
import { createGzip } from 'node:zlib'
import { isWithin } from '../project.ts'

const types: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.webmanifest': 'application/manifest+json; charset=utf-8',
	'.xml': 'application/xml; charset=utf-8',
	'.txt': 'text/plain; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.avif': 'image/avif',
	'.ico': 'image/x-icon',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.otf': 'font/otf',
	'.mp4': 'video/mp4',
	'.webm': 'video/webm',
}

const compressible = /^(text\/|application\/(json|xml|manifest)|image\/svg)/

function locate(dir: string, path: string) {
	const target = resolve(dir, `.${path}`)
	if (!isWithin(target, dir)) {
		return null
	}
	for (const candidate of [target, join(target, 'index.html'), `${target}.html`]) {
		if (existsSync(candidate) && statSync(candidate).isFile()) {
			return candidate
		}
	}
	return null
}

function send(res: ServerResponse, file: string, status: number, gzip: boolean) {
	const type = types[extname(file).toLowerCase()] ?? 'application/octet-stream'
	const headers: Record<string, string> = { 'Content-Type': type }
	if (/[\\/]_astro[\\/]/.test(file)) {
		headers['Cache-Control'] = 'public, max-age=31536000, immutable'
	}
	if (gzip && compressible.test(type)) {
		res.writeHead(status, {
			...headers,
			'Content-Encoding': 'gzip',
			Vary: 'Accept-Encoding',
		})
		createReadStream(file).pipe(createGzip()).pipe(res)
		return
	}
	res.writeHead(status, { ...headers, 'Content-Length': String(statSync(file).size) })
	createReadStream(file).pipe(res)
}

export async function serve(dir: string, base: string) {
	const notFound = join(dir, '404.html')
	const server = createServer((req, res) => {
		const url = new URL(req.url ?? '/', 'http://localhost')
		const gzip = /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''))
		const path = decodeURIComponent(url.pathname)
		const file = path.startsWith(base)
			? locate(dir, `/${path.slice(base.length)}`)
			: null
		if (file) {
			send(res, file, 200, gzip)
		} else if (existsSync(notFound)) {
			send(res, notFound, 404, gzip)
		} else {
			res.writeHead(404).end()
		}
	})
	await new Promise<void>(done => server.listen(0, '127.0.0.1', done))
	const { port } = server.address() as AddressInfo
	return {
		origin: `http://127.0.0.1:${port}`,
		close: () => new Promise<void>(done => server.close(() => done())),
	}
}

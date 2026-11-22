import { networkInterfaces } from 'node:os'
import type { AddressInfo } from 'node:net'
import type { AstroIntegration } from 'astro'
import QRCode from 'qrcode'

function hosts(address: AddressInfo | undefined) {
	if (!address || address.address === '127.0.0.1' || address.address === '::1') {
		return []
	}
	if (address.address !== '0.0.0.0' && address.address !== '::') {
		return [address.family === 'IPv6' ? `[${address.address}]` : address.address]
	}
	return Object.values(networkInterfaces()).flatMap(entries =>
		(entries ?? [])
			.filter(entry => entry.family === 'IPv4' && !entry.internal)
			.map(entry => entry.address),
	)
}

export function share(): AstroIntegration {
	let address: AddressInfo | undefined
	let base = '/'
	return {
		name: 'lift-share',
		hooks: {
			'astro:config:done': ({ config }) => {
				base = `${config.base.replace(/\/$/, '')}/`
			},
			'astro:server:start': options => {
				address = options.address
			},
			'astro:server:setup': ({ server }) => {
				server.middlewares.use(async (request, response, next) => {
					const query = new URL(request.url ?? '/', 'http://localhost')
					if (query.pathname !== `${base}__lift/share`) {
						return next()
					}
					try {
						const path = query.searchParams.get('path') ?? base
						const port = address?.port
						const urls = await Promise.all(
							hosts(address).map(async host => {
								const origin = `http://${host}:${port}`
								const url = new URL(path, origin)
								if (url.origin !== origin) {
									throw new Error(
										'The shared path must stay on the development server.',
									)
								}
								return {
									url: url.href,
									qr:
										'data:image/svg+xml;base64,' +
										Buffer.from(
											await QRCode.toString(url.href, {
												type: 'svg',
												margin: 3,
												errorCorrectionLevel: 'M',
												color: {
													dark: '#00dcff',
													light: '#02080f',
												},
											}),
										).toString('base64'),
								}
							}),
						)
						response.setHeader('Content-Type', 'application/json')
						response.setHeader('Cache-Control', 'no-store')
						response.end(JSON.stringify(urls))
					} catch (error) {
						next(error)
					}
				})
			},
		},
	}
}

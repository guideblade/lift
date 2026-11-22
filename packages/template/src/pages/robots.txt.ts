import type { APIRoute } from 'astro'
import { config } from '@config'
import { isIndexable } from '@libs/seo'
import { withBase } from '@libs/url'

export const GET: APIRoute = ({ site }) => {
	const indexable = isIndexable(config.seo.indexing)
	const lines = ['User-agent: *', indexable ? 'Allow: /' : 'Disallow: /']

	if (indexable && site && import.meta.env.__SITEMAP__) {
		lines.push(`Sitemap: ${new URL(withBase('sitemap-index.xml'), site).href}`)
	}

	return new Response(`${lines.join('\n')}\n`, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	})
}

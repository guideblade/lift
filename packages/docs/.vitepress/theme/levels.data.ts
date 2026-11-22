import { readFileSync } from 'node:fs'
import { relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMarkdownRenderer, defineLoader } from 'vitepress'
import { basePath } from '../base.ts'
import { levelFiles } from '../levels.ts'
import { type Level, levelOf } from './levels.ts'

declare const data: Level[]
export { data }

const root = fileURLToPath(new URL('../../../..', import.meta.url))

const relativeLink = /href="(?![a-z][a-z0-9+.-]*:|\/|#)([^"]*)"/g
const heading = /^# (.+)$/m

function absolute(html: string, url: string) {
	const base = basePath().replace(/\/$/, '')
	return html.replace(relativeLink, (_, href: string) => {
		const resolved = new URL(href, `https://docs${url}`)
		const path = resolved.pathname.replace(/\.html$/, '')
		return `href="${base}${path}${resolved.hash}"`
	})
}

const nested = (html: string) =>
	html
		.replace(/<h1[\s\S]*?<\/h1>/, '')
		.replace(/<a class="header-anchor"[^>]*>[\s\S]*?<\/a>/g, '')
		.replace(
			/<(\/?)h([2-4])\b[^>]*>/g,
			(_, close: string, level: string) => `<${close}h${Number(level) + 2}>`,
		)

export default defineLoader({
	watch: ['**/_skills/*/SKILL.md', '**/_briefs/*/BRIEF.md'],
	async load(): Promise<Level[]> {
		const md = await createMarkdownRenderer(root, {}, basePath())
		return levelFiles(root).flatMap(file => {
			const path = relative(root, file).split(sep).join('/')
			const found = levelOf(path)
			if (!found) {
				return []
			}
			const source = readFileSync(file, 'utf8')
			const env: { frontmatter?: Record<string, unknown>; relativePath: string } = {
				relativePath: path,
			}
			const url = `/${path.replace(/\.md$/, '')}`
			const html = md.render(source, env)
			return [
				{
					...found,
					url,
					title: source.match(heading)?.[1].trim() ?? found.name,
					description: String(env.frontmatter?.description ?? ''),
					html: nested(absolute(html, url)),
				},
			]
		})
	},
})

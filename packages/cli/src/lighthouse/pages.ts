import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { devRoutes, lighthouse, type Thresholds } from './config.ts'

export type Page = {
	file: string
	path: string
	slug: string
	thresholds: Thresholds
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function matcher(pattern: string) {
	const source = pattern
		.split('/')
		.map(segment => {
			if (/^\[\.\.\..+\]$/.test(segment)) {
				return '.*'
			}
			if (/^\[.+\]$/.test(segment)) {
				return '[^/]+'
			}
			return escape(segment)
		})
		.join('/')
	return new RegExp(`^${source}/?$`)
}

function toPath(file: string) {
	return `/${file.replace(/(^|\/)index\.html$/, '$1')}`
}

function toSlug(path: string) {
	return (
		path
			.replace(/^\/|\/$/g, '')
			.replace(/\.html$/, '')
			.replaceAll('/', '__') || 'index'
	)
}

function matches(rule: string | RegExp, path: string) {
	return typeof rule === 'string' ? rule === path : rule.test(path)
}

function thresholdsFor(path: string): Thresholds | null {
	let thresholds: Thresholds = { ...lighthouse.thresholds }
	for (const rule of lighthouse.pages.filter(rule => matches(rule.match, path))) {
		if (rule.skip) {
			return null
		}
		thresholds = { ...thresholds, ...rule.thresholds }
	}
	return thresholds
}

export function htmlPaths(dir: string) {
	return readdirSync(dir, { recursive: true, encoding: 'utf8' })
		.filter(file => file.endsWith('.html'))
		.map(file => file.split('\\').join('/'))
		.sort()
		.map(file => ({ file: join(dir, file), path: toPath(file) }))
}

export function builtBase(dir: string) {
	for (const { file } of htmlPaths(dir)) {
		const asset = readFileSync(file, 'utf8').match(/(?:href|src)="([^"]*?)_astro\//)
		if (asset) {
			return new URL(asset[1], 'http://localhost').pathname
		}
	}
	return null
}

export function devPagesIn(dir: string) {
	const routes = devRoutes.map(matcher)
	return htmlPaths(dir).filter(({ path }) => routes.some(route => route.test(path)))
}

export function pagesIn(dir: string): Page[] {
	return htmlPaths(dir).flatMap(({ file, path }) => {
		const thresholds = thresholdsFor(path)
		return thresholds ? [{ file, path, slug: toSlug(path), thresholds }] : []
	})
}

import { dirname, isAbsolute, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const pages = fileURLToPath(new URL('../../src/pages', import.meta.url))
const pageFolder = '_e2e'

export function routeOf(testFile: string): string {
	const path = relative(pages, dirname(testFile))
	const segments = path.split(sep)
	if (isAbsolute(path) || segments[0] === '..' || segments.pop() !== pageFolder) {
		throw new Error(
			`route is only available in src/pages/**/${pageFolder}, got ${testFile}`,
		)
	}
	if (segments[0] === '_dev') {
		segments.shift()
	}
	return `/${segments.join('/')}`
}

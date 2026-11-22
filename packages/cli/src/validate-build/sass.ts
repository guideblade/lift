import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { validateBuild } from './config.ts'

const call = new RegExp(
	`(?<![\\w-])(?:${validateBuild.sassFunctions.join('|')})\\([^)]*\\)`,
	'g',
)

function styles(file: string) {
	const source = readFileSync(file, 'utf8')
	return file.endsWith('.css')
		? source
		: [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
				.map(match => match[1])
				.join('\n')
}

export function unresolved(dir: string) {
	if (validateBuild.sassFunctions.length === 0) {
		return []
	}
	return readdirSync(dir, { recursive: true, encoding: 'utf8' })
		.filter(file => /\.(css|html)$/.test(file))
		.map(file => join(dir, file))
		.sort()
		.flatMap(file => (styles(file).match(call) ?? []).map(found => ({ file, found })))
}

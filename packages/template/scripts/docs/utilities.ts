import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile } from '@tailwindcss/node'

const entry = resolve(
	dirname(fileURLToPath(import.meta.url)),
	'../../src/libs/styles/tailwind.css',
)

const source = () =>
	[
		`@reference ${JSON.stringify(entry.replaceAll('\\', '/'))};`,
		'@layer tailwind {',
		'\t@layer utilities {',
		'\t\t@tailwind utilities;',
		'\t}',
		'}',
	].join('\n')

let compiler: ReturnType<typeof compile> | undefined
let stamp = ''

function compilerFor() {
	const current = readFileSync(entry, 'utf8')
	if (!compiler || current !== stamp) {
		stamp = current
		compiler = compile(source(), {
			base: dirname(entry),
			onDependency: () => undefined,
		})
	}
	return compiler
}

const classProp = /class/i

const candidatesOf = (values: Record<string, unknown>) =>
	Object.entries(values)
		.filter(([key]) => classProp.test(key))
		.map(([, value]) => value)
		.filter(value => typeof value === 'string')
		.flatMap(value => value.split(/\s+/))
		.filter(Boolean)

export async function utilities(values: Record<string, unknown>) {
	const candidates = candidatesOf(values)
	if (!candidates.length) {
		return ''
	}
	return (await compilerFor()).build(candidates)
}

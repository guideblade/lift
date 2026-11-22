import { readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { rel, root } from '../project.ts'
import { validateBuild } from './config.ts'
import { elements, rate } from './dom.ts'
import { nu } from './nu.ts'
import { unresolved } from './sass.ts'

const write = (text: string) => process.stdout.write(`${text}\n`)

const dist = () => resolve(root(), validateBuild.dist)

function pages(dir: string) {
	return readdirSync(dir, { recursive: true, encoding: 'utf8' })
		.filter(file => file.endsWith('.html'))
		.map(file => join(dir, file))
		.sort()
}

export async function html() {
	write('Markup (Nu Html Checker)\n')
	const messages = await nu(dist())
	for (const item of messages) {
		const at = item.line ? `:${item.line}${item.column ? `:${item.column}` : ''}` : ''
		write(`${rel(item.file)}${at}  ${item.level}  ${item.text}`)
	}
	const errors = messages.filter(item => item.level === 'error').length
	write(`\n${errors} error(s), ${messages.length - errors} warning(s)\n`)
	return errors === 0
}

export function dom() {
	write('DOM size (elements per page)\n')
	const rows = pages(dist())
		.map(file => ({ file, total: elements(file) }))
		.map(row => ({ ...row, tier: rate(row.total) }))
		.sort((a, b) => b.total - a.total)
	const width = Math.max(...rows.map(row => row.tier.label.length))
	for (const { file, total, tier } of rows) {
		write(`${String(total).padStart(6)}  ${tier.label.padEnd(width)}  ${rel(file)}`)
	}
	const failed = rows.filter(row => row.tier.level === 'fail').length
	const slow = rows.filter(row => row.tier.level === 'warn').length
	write(`\n${rows.length} page(s), ${slow} slow, ${failed} over the limit\n`)
	return failed === 0
}

export function sass() {
	write('Uncompiled Sass calls in CSS\n')
	const found = unresolved(dist())
	for (const item of found) {
		write(`${rel(item.file)}  ${item.found}`)
	}
	write(`${found.length ? '\n' : ''}${found.length} call(s)\n`)
	return found.length === 0
}

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { project, targetOf } from './sources.ts'

type Use = { file: string; target: string; names: string[] }

const scanned = ['src', 'scripts', 'e2e']
const sourceFile = /\.(ts|astro|vue)$/
const importClause =
	/(?:import|export)\s+(?:type\s+)?((?:[\w$]+\s*,\s*)?\{[^}]*\}|[\w$]+|\*\s+as\s+[\w$]+)\s+from\s+['"]([^'"]+)['"]/g

const walk = (dir: string): string[] =>
	existsSync(dir)
		? readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
				const path = join(dir, entry.name)
				if (entry.isDirectory()) {
					return entry.name === 'node_modules' ? [] : walk(path)
				}
				return sourceFile.test(entry.name) ? [path] : []
			})
		: []

function namesOf(clause: string) {
	if (clause.startsWith('*')) {
		return ['*']
	}
	const braces = clause.match(/\{([^}]*)\}/)?.[1] ?? ''
	const named = braces
		.split(',')
		.map(
			part =>
				part
					.replace(/^\s*type\s+/, '')
					.split(/\s+as\s+/)[0]
					?.trim() ?? '',
		)
		.filter(Boolean)
	return /^[\w$]+(?=\s*(,|$))/.test(clause) ? ['default', ...named] : named
}

let uses: Use[] | null = null

export const allUses = () =>
	(uses ??= scanned
		.flatMap(folder => walk(join(project, folder)))
		.flatMap(file =>
			[...readFileSync(file, 'utf8').matchAll(importClause)].flatMap(
				([, clause = '', specifier = '']) => {
					const target = targetOf(file, specifier)
					return target ? [{ file, target, names: namesOf(clause) }] : []
				},
			),
		))

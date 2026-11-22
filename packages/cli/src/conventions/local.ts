import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { project, root } from '../project.ts'
import { conventionsEntry, conventionsFolder, Scope } from './api/scope.ts'
import type { Check } from './api/types.ts'
import type { Violation } from './types.ts'

export type Local = {
	dir: string
	checks: Check[]
}

const skipped = (name: string) =>
	name.startsWith('.') || name === 'node_modules' || name === 'dist'

function find(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true })
		.filter(entry => entry.isDirectory() && !skipped(entry.name))
		.flatMap(entry => {
			const path = join(dir, entry.name)
			if (entry.name !== conventionsFolder) {
				return find(path)
			}
			return existsSync(join(path, conventionsEntry)) ? [dir] : []
		})
}

export async function discoverLocal(): Promise<Local[]> {
	return Promise.all(
		find(root()).map(async dir => ({
			dir,
			checks: (
				(
					await import(
						pathToFileURL(join(dir, conventionsFolder, conventionsEntry)).href
					)
				).default as Lift.Rules
			)(project().adapter.conventions),
		})),
	)
}

export const runLocal = ({ dir, checks }: Local, focus: string[] | null): Violation[] => {
	const scope = new Scope(dir, null, focus)
	return checks.flatMap(check => check.run(scope))
}

export function describeLocal(checks: readonly Check[]) {
	const lines: string[] = []
	const seen = new Set<Check>()
	const walk = (items: readonly Check[], depth: number) => {
		for (const item of items) {
			const indent = '  '.repeat(depth)
			if (seen.has(item)) {
				lines.push(`${indent}↻ ${item.description}`)
				continue
			}
			seen.add(item)
			lines.push(`${indent}${item.description}`)
			if (item.inner) {
				walk(item.inner(), depth + 1)
			}
		}
	}
	walk(checks, 0)
	return lines
}

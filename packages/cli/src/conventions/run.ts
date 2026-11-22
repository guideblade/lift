import { resolve } from 'node:path'
import { discoverLocal, runLocal } from './local.ts'
import { isWithin, root } from '../project.ts'
import type { Violation } from './types.ts'

export type RunOptions = {
	targets: string[] | null
	only: Set<string> | null
}

const related = (path: string, targets: string[] | null) =>
	targets === null ||
	targets.some(target => isWithin(path, target) || isWithin(target, path))

export async function run({ targets, only }: RunOptions): Promise<Violation[]> {
	const locals = (await discoverLocal()).filter(local => related(local.dir, targets))
	return locals
		.flatMap(local => runLocal(local, targets))
		.filter(item => only === null || only.has(item.rule))
		.filter(item => related(resolve(root(), item.file), targets))
		.sort(
			(a, b) =>
				a.file.localeCompare(b.file) ||
				(a.line ?? 0) - (b.line ?? 0) ||
				a.rule.localeCompare(b.rule),
		)
}

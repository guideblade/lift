import { resolve } from 'node:path'
import { changedFiles, hookFile } from '../lib/targets.ts'
import { isWithin, rel, root } from '../project.ts'
import { conventionsFolder } from './api/scope.ts'
import { describeLocal, discoverLocal } from './local.ts'
import { run } from './run.ts'
import type { Violation } from './types.ts'

export type CheckOptions = {
	paths: string[]
	hook: boolean
	changed: boolean
	rule: string | undefined
	json: boolean
}

const write = (text: string) => process.stdout.write(`${text}\n`)
export const localDirs = async () => (await discoverLocal()).map(local => local.dir)
export const inScope = (dirs: string[]) => (path: string) =>
	dirs.some(dir => isWithin(path, dir))

async function targets(options: CheckOptions) {
	if (options.hook) {
		const file = await hookFile()
		return file ? [file].filter(inScope(await localDirs())) : []
	}
	if (options.changed) {
		return changedFiles().filter(inScope(await localDirs()))
	}
	return options.paths.length > 0
		? options.paths.map(path => resolve(root(), path))
		: null
}

function print(violations: Violation[]) {
	for (const item of violations) {
		write(
			`${item.file}${item.line ? `:${item.line}` : ''}  ${item.rule}  ${item.message}`,
		)
	}
	const files = new Set(violations.map(item => item.file)).size
	write(`\n${violations.length} violation(s) in ${files} file(s)`)
}

export async function list() {
	for (const local of await discoverLocal()) {
		write(`${rel(local.dir)}/${conventionsFolder}`)
		describeLocal(local.checks).forEach(line => write(`  ${line}`))
		write('')
	}
}

export async function check(options: CheckOptions) {
	const selected = await targets(options)
	if (selected?.length === 0) {
		return 0
	}
	const only = options.rule ? new Set(options.rule.split(',')) : null
	const violations = await run({ targets: selected, only })
	output(options, violations)
	if (violations.length === 0) {
		return 0
	}
	return options.hook ? 2 : 1
}

function output(options: CheckOptions, violations: Violation[]) {
	if (options.json) {
		write(JSON.stringify(violations, null, '\t'))
	} else if (options.hook) {
		violations.forEach(item =>
			process.stderr.write(
				`${item.file}:${item.line ?? 1} ${item.rule} ${item.message}\n`,
			),
		)
	} else {
		print(violations)
	}
}

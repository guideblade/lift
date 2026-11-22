import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { inScope, localDirs } from '../conventions/main.ts'
import { run } from '../conventions/run.ts'
import { changedFiles, hookFile, trackedFiles } from '../lib/targets.ts'
import { fail, isWithin, project, rel, root } from '../project.ts'

export type CheckOptions = {
	paths: string[]
	hook: boolean
	changed: boolean
	only: string | undefined
}

type Result = { name: string; ok: boolean; output: string }

const conventions = 'conventions'

function expand(path: string) {
	const absolute = resolve(root(), path)
	if (!existsSync(absolute)) {
		return fail(`${path} does not exist`)
	}
	return statSync(absolute).isDirectory() ? trackedFiles(rel(absolute)) : [absolute]
}

async function targets(options: CheckOptions) {
	if (options.hook) {
		const file = await hookFile()
		return file ? [file] : []
	}
	const files = options.changed
		? changedFiles().filter(existsSync)
		: (options.paths.length > 0 ? options.paths : ['.']).flatMap(expand)
	return [...new Set(files)].filter(file => isWithin(file, root()))
}

function binPath({ bin, package: name = bin }: Lift.FileCheck): string {
	for (let dir = root(); ; dir = dirname(dir)) {
		const manifest = join(dir, 'node_modules', name, 'package.json')
		if (existsSync(manifest)) {
			const field = (
				JSON.parse(readFileSync(manifest, 'utf8')) as {
					bin?: string | Record<string, string>
				}
			).bin
			const entry = typeof field === 'string' ? field : field?.[bin]
			return entry
				? join(dirname(manifest), entry)
				: fail(`${name} has no \`${bin}\` binary`)
		}
		if (dirname(dir) === dir) {
			return fail(`${name} is not installed in ${root()} or above`)
		}
	}
}

async function runConventions(files: string[]): Promise<Result | null> {
	const scoped = files.filter(inScope(await localDirs()))
	if (scoped.length === 0) {
		return null
	}
	const violations = await run({ targets: scoped, only: null })
	return {
		name: conventions,
		ok: violations.length === 0,
		output: violations
			.map(item => `${item.file}:${item.line ?? 1}  ${item.rule}  ${item.message}`)
			.join('\n'),
	}
}

const commandLimit = 6000

function batches(files: string[]) {
	const groups: string[][] = [[]]
	let length = 0
	for (const file of files) {
		if (length + file.length > commandLimit && length > 0) {
			groups.push([])
			length = 0
		}
		groups.at(-1)?.push(file)
		length += file.length + 1
	}
	return groups
}

const spawnCheck = (item: Lift.FileCheck, files: string[]) =>
	spawnSync(process.execPath, [binPath(item), ...(item.args ?? []), ...files], {
		cwd: root(),
		encoding: 'utf8',
		env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
	})

function runCheck(item: Lift.FileCheck, files: string[]): Result | null {
	const matched = files.map(rel).filter(file => item.files.test(file))
	if (matched.length === 0) {
		return null
	}
	const results = (item.whole ? [[]] : batches(matched)).map(group =>
		spawnCheck(item, group),
	)
	return {
		name: item.name,
		ok: results.every(result => result.status === 0),
		output: results
			.map(result =>
				`${result.stdout ?? ''}${result.stderr ?? ''}${result.error?.message ?? ''}`.trim(),
			)
			.filter(Boolean)
			.join('\n'),
	}
}

async function runAll(options: CheckOptions, files: string[]) {
	const only = options.only ? new Set(options.only.split(',')) : null
	const wanted = (name: string) => !only || only.has(name)
	const checks = (project().config.checks ?? []).filter(
		item => wanted(item.name) && !(options.hook && item.hook === false),
	)
	return [
		wanted(conventions) ? await runConventions(files) : null,
		...checks.map(item => runCheck(item, files)),
	].filter(result => result !== null)
}

export async function check(options: CheckOptions) {
	const files = await targets(options)
	return files.length === 0 ? 0 : report(options, await runAll(options, files))
}

function report(options: CheckOptions, results: Result[]) {
	const failed = results.filter(result => !result.ok)
	if (options.hook) {
		failed.forEach(result =>
			process.stderr.write(`${result.name}\n${result.output}\n`),
		)
		return failed.length > 0 ? 2 : 0
	}
	for (const result of results) {
		process.stdout.write(`${result.ok ? 'ok    ' : 'failed'}  ${result.name}\n`)
		if (!result.ok && result.output) {
			process.stdout.write(`${result.output.replace(/^/gm, '        ')}\n`)
		}
	}
	process.stdout.write(
		`\n${results.length - failed.length} of ${results.length} passed\n`,
	)
	return failed.length > 0 ? 1 : 0
}

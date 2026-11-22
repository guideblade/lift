import { existsSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Errors } from '@oclif/core'
import {
	type Adapter,
	adapters,
	type ProjectConfig,
	supported,
} from './contract/index.ts'
import { resolveAliases } from './lib/aliases.ts'

export const configFile = 'lift.config.ts'

const cli = fileURLToPath(new URL('..', import.meta.url))

export const fail = (message: string): never => Errors.error(message, { exit: 1 })

export type Project = {
	root: string
	contract: number
	config: ProjectConfig
	adapter: Adapter
}

let current: Project | undefined

export function findRoot(start: string): string | null {
	if (existsSync(join(start, configFile))) {
		return start
	}
	const parent = dirname(start)
	return parent === start ? null : findRoot(parent)
}

export function flagValue(argv: readonly string[], name: string) {
	const inline = argv.find(arg => arg.startsWith(`--${name}=`))
	if (inline) {
		return inline.slice(`--${name}=`.length)
	}
	const index = argv.indexOf(`--${name}`)
	return index === -1 ? undefined : argv[index + 1]
}

export const projectFlag = (argv: readonly string[]) => flagValue(argv, 'project')

const manifest = join(cli, 'package.json')

function aliases(): Record<string, string> {
	const { lift } = JSON.parse(readFileSync(manifest, 'utf8')) as {
		lift?: { aliases?: Record<string, string> }
	}
	return lift?.aliases ?? {}
}

function explicitProject(value: string, cwd: string, known: Record<string, string>) {
	const alias = known[value]
	if (alias) {
		return resolve(cli, alias)
	}
	const path = resolve(cwd, value)
	if (existsSync(path) || isAbsolute(value) || /[\\/]/.test(value)) {
		return path
	}
	const sibling = resolve(cli, '..', value)
	return existsSync(join(sibling, configFile))
		? sibling
		: fail(
				`Unknown project: ${value}. Pass a project name, folder, or lift.aliases name.`,
			)
}

export function projectPath(name: string, value: string | undefined) {
	const known = aliases()
	const cwd = process.env.INIT_CWD ?? process.cwd()
	if (value) {
		return explicitProject(value, cwd, known)
	}
	if (name === 'project') {
		const nearest = findRoot(cwd)
		if (nearest) {
			return nearest
		}
	}
	const fallback = known[name]
	return fallback
		? resolve(cli, fallback)
		: fail(`pass --${name}, or set \`lift.aliases.${name}\` in ${manifest}`)
}

export const projectStart = (flag: string | undefined) => projectPath('project', flag)

function adapterFor(raw: Partial<Lift.Config>, root: string): Adapter {
	const { contract } = raw
	if (typeof contract !== 'number') {
		return fail(`${join(root, configFile)} has no \`contract\` version`)
	}
	if (contract > supported.max) {
		return fail(
			`${root} uses contract ${contract}, this toolkit supports up to ${supported.max}: update the toolkit`,
		)
	}
	const adapter = contract >= supported.min ? adapters[contract] : undefined
	return (
		adapter ??
		fail(
			`${root} uses contract ${contract}, which this toolkit no longer supports (oldest: ${supported.min})`,
		)
	)
}

export async function openProject(start: string) {
	const root = findRoot(start) ?? fail(`no ${configFile} in ${start} or above`)
	resolveAliases(root)
	const raw = (await import(pathToFileURL(join(root, configFile)).href)).default as
		| Partial<Lift.Config>
		| undefined
	const adapter = adapterFor(raw ?? {}, root)
	current = {
		root,
		contract: raw?.contract ?? 0,
		config: adapter.config(raw as Lift.Config),
		adapter,
	}
	return current
}

export const project = () => current ?? fail('no Lift project is open')

export const root = () => project().root

export const rel = (path: string) => relative(root(), path).split(sep).join('/')

export const isWithin = (path: string, parent: string) => {
	const diff = relative(parent, path)
	return !diff.startsWith('..') && !isAbsolute(diff)
}

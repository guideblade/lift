import { existsSync, readdirSync } from 'node:fs'
import { basename, dirname, join, relative, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Args, type Command, Flags, type Interfaces, loadHelpClass } from '@oclif/core'
import { ProjectCommand } from './base.ts'
import { resolveAliases } from './lib/aliases.ts'
import { Transaction } from './lib/files.ts'
import { ask, pick, question } from './lib/prompt.ts'
import {
	fail,
	findRoot,
	projectFlag,
	projectPath,
	projectStart,
	root,
} from './project.ts'

const commandsFolder = '_commands'
const rootFile = 'index.ts'

const skipped = (name: string) => name.startsWith('.') || name === 'node_modules'

function find(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true })
		.filter(entry => entry.isDirectory() && !skipped(entry.name))
		.flatMap(entry => {
			const path = join(dir, entry.name)
			return entry.name === commandsFolder ? [path] : find(path)
		})
}

const files = (dir: string) =>
	readdirSync(dir, { withFileTypes: true })
		.filter(entry => entry.isFile() && entry.name.endsWith('.ts'))
		.map(entry => join(dir, entry.name))

const flag = ({ name, description, type, exclusive }: Lift.CommandFlag) => [
	name,
	type === 'boolean' || type === undefined
		? Flags.boolean({ description, exclusive })
		: Flags.string({
				description:
					type === 'project'
						? `${description ?? name}: a folder, or a name from \`lift.aliases\` (default: the \`${name}\` alias)`
						: description,
				exclusive,
			}),
]

function projectFlags(definition: Lift.Command, flags: Record<string, unknown>) {
	const resolved = { ...flags } as Record<string, string | boolean | undefined>
	for (const item of definition.flags ?? []) {
		if (item.type === 'project') {
			const path = projectPath(item.name, flags[item.name] as string | undefined)
			resolved[item.name] =
				findRoot(path) === path
					? path
					: fail(`--${item.name}: no lift.config.ts in ${path}`)
		}
	}
	return resolved
}

function wrap(definition: Lift.Command, topic: string | null): typeof Command {
	return class extends ProjectCommand {
		static override hidden = topic !== null
		static override usage = topic === null ? undefined : `${topic} COMMAND`
		static override summary = definition.summary
		static override description = definition.description
		static override examples = (definition.examples ?? []).map(example =>
			`<%= config.bin %> <%= command.id %> ${example}`.trimEnd(),
		)
		static override args = Object.fromEntries(
			(definition.args ?? []).map(arg => [
				arg.name,
				Args.string({ description: arg.description, required: arg.required }),
			]),
		)
		static override flags = Object.fromEntries((definition.flags ?? []).map(flag))

		async run() {
			const { args, flags } = await this.parse(this.ctor)
			const transaction = new Transaction(root())
			try {
				await definition.run({
					root: root(),
					cwd: process.env.INIT_CWD ?? process.cwd(),
					args,
					flags: projectFlags(definition, flags),
					interactive: Boolean(process.stdin.isTTY),
					log: text => this.log(text),
					fail,
					ask: text => ask(question(text)),
					pick,
					files: transaction,
					help: async () => {
						await describeTopics(this.config, this.argv)
						const Help = await loadHelpClass(this.config)
						await new Help(this.config).showHelp([this.id ?? ''])
					},
				})
			} catch (error) {
				if (transaction.changes > 0) {
					this.warn('Rolling back the changes of this command')
					await transaction.rollback()
				}
				throw error
			}
		}
	}
}

const segment = (name: string) => name.replace(/^\((.+)\)$/, '$1')

const foldersOf = (src: string, dir: string) =>
	relative(src, dirname(dir)).split(sep).filter(Boolean)

const commandId = (src: string, dir: string, file: string) =>
	[
		...foldersOf(src, dir).map(segment),
		...(basename(file) === rootFile ? [] : [basename(file, '.ts')]),
	].join(':')

function sources(argv: readonly string[]) {
	const found = findRoot(projectStart(projectFlag(argv)))
	if (!found) {
		return { root: null, src: '', dirs: [] }
	}
	const src = join(found, 'src')
	return { root: found, src, dirs: find(src) }
}

export async function projectCommands(argv: readonly string[]) {
	const { root: found, src, dirs } = sources(argv)
	if (found) {
		resolveAliases(found)
	}
	const entries = await Promise.all(
		dirs.flatMap(dir =>
			files(dir).map(async file => {
				const definition = (await import(pathToFileURL(file).href))
					.default as Lift.Command
				const id = commandId(src, dir, file)
				const topic = basename(file) === rootFile ? id.replaceAll(':', ' ') : null
				return [id, wrap(definition, topic)] as const
			}),
		),
	)
	return Object.fromEntries(entries)
}

async function rootSummary(dir: string) {
	const file = join(dir, rootFile)
	return existsSync(file)
		? ((await import(pathToFileURL(file).href)).default as Lift.Command).summary
		: null
}

export async function projectTopics(argv: readonly string[]) {
	const { src, dirs } = sources(argv)
	const topics = new Map<string, string>()
	for (const dir of dirs) {
		const summary = await rootSummary(dir)
		if (summary) {
			topics.set(foldersOf(src, dir).map(segment).join(':'), summary)
		}
	}
	return topics
}

export async function describeTopics(config: Interfaces.Config, argv: readonly string[]) {
	const builtIn = new Set(Object.keys(config.pjson.oclif.topics ?? {}))
	const described = await projectTopics(argv)
	for (const topic of config.topics) {
		const description = described.get(topic.name)
		if (description && !builtIn.has(topic.name)) {
			topic.description = description
		}
	}
}

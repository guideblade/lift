import { existsSync, readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { join, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { fail, isWithin } from '../project.ts'

type Alias = { key: string; target: string; exact: boolean }

const registered = new Set<string>()

function readPaths(file: string): Record<string, string[]> {
	try {
		return (
			(
				JSON.parse(readFileSync(file, 'utf8')) as {
					compilerOptions?: { paths?: Record<string, string[]> }
				}
			).compilerOptions?.paths ?? {}
		)
	} catch {
		return fail(`${file} is not plain JSON, so its \`paths\` cannot be read`)
	}
}

function aliasesOf(root: string): Alias[] {
	const file = join(root, 'tsconfig.json')
	if (!existsSync(file)) {
		return []
	}
	return Object.entries(readPaths(file))
		.map(([key, [target = '']]) => ({
			key: key.replace(/\*$/, ''),
			target: join(root, target.replace(/\*$/, '')),
			exact: !key.endsWith('*'),
		}))
		.sort((a, b) => b.key.length - a.key.length)
}

const inProject = (root: string, parentURL: string | undefined) => {
	if (!parentURL?.startsWith('file:')) {
		return false
	}
	const parent = fileURLToPath(parentURL)
	return isWithin(parent, root) && !parent.includes(`${sep}node_modules${sep}`)
}

export function resolveAliases(root: string) {
	if (registered.has(root)) {
		return
	}
	registered.add(root)
	const aliases = aliasesOf(root)
	if (aliases.length === 0) {
		return
	}
	registerHooks({
		resolve(specifier, context, nextResolve) {
			const alias = inProject(root, context.parentURL)
				? aliases.find(({ key, exact }) =>
						exact ? specifier === key : specifier.startsWith(key),
					)
				: undefined
			if (!alias) {
				return nextResolve(specifier, context)
			}
			const target = alias.exact
				? alias.target
				: join(alias.target, specifier.slice(alias.key.length))
			return nextResolve(pathToFileURL(target).href, context)
		},
	})
}

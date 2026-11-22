import { type Dirent, existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import postcssScss from 'postcss-scss'
import { isWithin } from '../../project.ts'
import { kindFolders } from '../../layered/kinds.ts'
import { AstroFile } from './astro.ts'
import { Script } from './script.ts'

export const conventionsFolder = '_conventions'
export const conventionsEntry = 'index.ts'

const isOwn = (dir: string, entry: Dirent) =>
	entry.isDirectory() &&
	(kindFolders.includes(entry.name) ||
		(entry.name === conventionsFolder &&
			existsSync(join(dir, entry.name, conventionsEntry))))

export const toPascal = (name: string) =>
	name
		.split('-')
		.map(part => part.charAt(0).toUpperCase() + part.slice(1))
		.join('')

export class Scope {
	readonly dir: string
	readonly name: string
	readonly pascal: string
	readonly parent: Scope | null
	readonly focus: readonly string[] | null
	readonly #cache = new Map<string, unknown>()
	readonly #children = new Map<string, Scope>()

	constructor(dir: string, parent: Scope | null = null, focus: string[] | null = null) {
		this.dir = dir
		this.parent = parent
		this.focus = parent ? parent.focus : focus
		this.name = basename(dir)
		this.pascal = toPascal(this.name)
	}

	path(...parts: string[]) {
		return join(this.dir, ...parts)
	}

	child(name: string): Scope {
		const found = this.#children.get(name)
		if (found) {
			return found
		}
		const made = new Scope(this.path(name), this)
		this.#children.set(name, made)
		return made
	}

	inFocus(path: string) {
		return (
			this.focus === null ||
			this.focus.some(target => isWithin(target, path) || isWithin(path, target))
		)
	}

	entries(...parts: string[]): Dirent[] {
		return this.#memo(`entries:${parts.join('/')}`, () => {
			const dir = this.path(...parts)
			if (!existsSync(dir) || !statSync(dir).isDirectory()) {
				return []
			}
			return readdirSync(dir, { withFileTypes: true }).filter(
				entry => !isOwn(dir, entry),
			)
		})
	}

	has(...parts: string[]) {
		return existsSync(this.path(...parts))
	}

	read(file: string): string | null {
		const path = this.path(file)
		return existsSync(path) && statSync(path).isFile()
			? readFileSync(path, 'utf8')
			: null
	}

	astro(file: string): AstroFile | null {
		return this.#memo(`astro:${file}`, () => {
			const source = this.read(file)
			return source === null ? null : new AstroFile(this.path(file), source)
		})
	}

	ts(file: string): Script | null {
		return this.#memo(`ts:${file}`, () => {
			const source = this.read(file)
			return source === null ? null : new Script(this.path(file), source)
		})
	}

	script(file: string): Script | null | undefined {
		if (file.endsWith('.astro')) {
			const astro = this.astro(file)
			return astro ? astro.frontmatter : undefined
		}
		return this.ts(file) ?? undefined
	}

	scss(file: string) {
		return this.#memo(`scss:${file}`, () => {
			const source = this.read(file)
			return source === null ? null : postcssScss.parse(source)
		})
	}

	#memo<T>(key: string, make: () => T): T {
		if (!this.#cache.has(key)) {
			this.#cache.set(key, make())
		}
		return this.#cache.get(key) as T
	}
}

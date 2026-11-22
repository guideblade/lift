import { access, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fail } from '../project.ts'

export async function exists(path: string) {
	try {
		await access(path)
		return true
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			return false
		}
		throw error
	}
}

export async function assertMissing(path: string, message: string) {
	if (await exists(path)) {
		fail(message)
	}
}

type Undo = () => Promise<void>

export class Transaction implements Lift.Files {
	readonly #root: string
	readonly #undo: Undo[] = []
	readonly #tracked = new Set<string>()

	constructor(root: string) {
		this.#root = root
	}

	get changes() {
		return this.#undo.length
	}

	async create(path: string, content: string) {
		const file = resolve(this.#root, path)
		await assertMissing(file, `Refusing to overwrite existing file: ${file}`)
		const made = await mkdir(dirname(file), { recursive: true })
		if (made) {
			this.#undo.push(() => rm(made, { recursive: true, force: true }))
		}
		await writeFile(file, content, 'utf8')
		this.#undo.push(() => rm(file, { force: true }))
		return file
	}

	async update(path: string, edit: (content: string) => string | Promise<string>) {
		const file = await this.track(path)
		const previous = await readFile(file, 'utf8')
		const next = await edit(previous)
		if (next !== previous) {
			await writeFile(file, next, 'utf8')
		}
		return file
	}

	async copy(from: string, to: string) {
		const file = resolve(this.#root, to)
		await assertMissing(file, `Refusing to overwrite existing file: ${file}`)
		const made = await mkdir(dirname(file), { recursive: true })
		if (made) {
			this.#undo.push(() => rm(made, { recursive: true, force: true }))
		}
		await copyFile(from, file)
		this.#undo.push(() => rm(file, { force: true }))
		return file
	}

	async track(path: string) {
		const file = resolve(this.#root, path)
		if (this.#tracked.has(file)) {
			return file
		}
		this.#tracked.add(file)
		const previous = (await exists(file)) ? await readFile(file, 'utf8') : null
		this.#undo.push(() =>
			previous === null
				? rm(file, { force: true })
				: writeFile(file, previous, 'utf8'),
		)
		return file
	}

	async rollback() {
		for (let undo = this.#undo.pop(); undo; undo = this.#undo.pop()) {
			try {
				await undo()
			} catch (error) {
				console.error('Failed to roll back a change:', error)
			}
		}
	}
}

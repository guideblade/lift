import { existsSync } from 'node:fs'
import { type Generated, type Generator, staleFiles } from '@scripts/generated.ts'
import { posix } from './names.ts'

export { generators } from '@scripts/generated.ts'

export async function sync(context: Lift.CommandContext, generator: Generator) {
	let stale: Generated[] = []
	try {
		stale = staleFiles(context.root, generator)
	} catch (error) {
		return context.fail(error instanceof Error ? error.message : String(error))
	}
	for (const file of stale) {
		if (existsSync(file.path)) {
			await context.files.update(file.path, () => file.content)
		} else {
			await context.files.create(file.path, file.content)
		}
		context.log(`Wrote ${posix(context.root, file.path)}`)
	}
	if (stale.length === 0) {
		context.log('Generated files are up to date')
	}
}

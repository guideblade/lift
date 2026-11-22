import { Args } from '@oclif/core'
import { ProjectCommand } from '../base.ts'
import type { Kind } from './kinds.ts'

export const listCommand = (kind: Kind) =>
	class extends ProjectCommand {
		static override summary = `List every ${kind.noun} in the project`

		async run() {
			await this.parse(this.ctor)
			const { listing } = await import('./render.ts')
			const lines = listing(kind)
			this.log(lines.length > 0 ? lines.join('\n') : `No ${kind.topic}`)
		}
	}

export const readCommand = (kind: Kind) =>
	class extends ProjectCommand {
		static override summary = `Read the ${kind.noun} pieces that apply to the given paths`
		static override description =
			kind.topic === 'skills'
				? 'Pass project-relative paths to read the applicable pieces. Omit paths to list the available scopes.'
				: `Paths are relative to the project. A child covers the folder that holds its ${kind.folder} folder and paths inside it. Without paths it prints the root and a map of the children.`
		static override examples = [
			'<%= config.bin %> <%= command.id %> <name>',
			'<%= config.bin %> <%= command.id %> <name> src/components/primitives/text',
		]
		static override strict = false
		static override args = {
			name: Args.string({ description: `${kind.noun} name`, required: true }),
			paths: Args.string({ description: 'files or folders you work on' }),
		}

		async run() {
			const { args, argv } = await this.parse(this.ctor)
			const { named, readItem } = await import('./render.ts')
			const name = String(args.name)
			this.log(readItem(kind, named(kind, name), (argv as string[]).slice(1)))
		}
	}

export const checkCommand = (kind: Kind) =>
	class extends ProjectCommand {
		static override summary = `Check every ${kind.folder}: one root per name, and its fields`

		async run() {
			await this.parse(this.ctor)
			const { checkKind } = await import('./check.ts')
			const { items, problems } = checkKind(kind)
			problems.forEach(({ file, message }) => this.log(`${file}  ${message}`))
			this.log(`${items} ${kind.noun}(s), ${problems.length} problem(s)`)
			process.exitCode = problems.length > 0 ? 1 : 0
		}
	}

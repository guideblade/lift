import { Args, Flags } from '@oclif/core'
import { ProjectCommand } from '../base.ts'

export default class Check extends ProjectCommand {
	static override summary =
		'Run the conventions and the checks of lift.config.ts on files or folders'
	static override examples = [
		'<%= config.bin %> <%= command.id %>',
		'<%= config.bin %> <%= command.id %> "src/components/blocks/(header)"',
		'<%= config.bin %> <%= command.id %> --changed',
		'<%= config.bin %> <%= command.id %> src/libs --only stylelint,oxlint',
	]
	static override strict = false
	static override args = {
		paths: Args.string({
			description: 'files or folders to check (default: the whole project)',
			ignoreStdin: true,
		}),
	}
	static override flags = {
		changed: Flags.boolean({ description: 'check files changed since HEAD' }),
		only: Flags.string({
			description:
				'run only these checks, comma-separated (`conventions` included)',
		}),
		hook: Flags.boolean({
			description: 'read the edited file from an edit hook on stdin',
			hidden: true,
		}),
	}

	async run() {
		const { argv, flags } = await this.parse(Check)
		const { check } = await import('../check/main.ts')
		process.exitCode = await check({
			paths: (argv as string[]).filter(arg => !arg.startsWith('--project')),
			hook: flags.hook,
			changed: flags.changed,
			only: flags.only,
		})
	}
}

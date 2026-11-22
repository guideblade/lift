import { Args, Flags } from '@oclif/core'
import { ProjectCommand } from '../../base.ts'

export default class ConventionsCheck extends ProjectCommand {
	static override summary = 'Check every folder that has _conventions against its rules'
	static override examples = [
		'<%= config.bin %> <%= command.id %>',
		'<%= config.bin %> <%= command.id %> src/components',
		'<%= config.bin %> <%= command.id %> --changed',
	]
	static override strict = false
	static override args = {
		paths: Args.string({
			description: 'files or folders to check',
			ignoreStdin: true,
		}),
	}
	static override flags = {
		changed: Flags.boolean({ description: 'check files changed since HEAD' }),
		rule: Flags.string({ description: 'check only these rules, comma-separated' }),
		json: Flags.boolean({ description: 'print violations as JSON' }),
		hook: Flags.boolean({
			description: 'read the edited file from an edit hook on stdin',
			hidden: true,
		}),
	}

	async run() {
		const { argv, flags } = await this.parse(ConventionsCheck)
		const { check } = await import('../../conventions/main.ts')
		process.exitCode = await check({
			paths: (argv as string[]).filter(arg => !arg.startsWith('--project')),
			hook: flags.hook,
			changed: flags.changed,
			rule: flags.rule,
			json: flags.json,
		})
	}
}

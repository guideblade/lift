import { Args, Flags } from '@oclif/core'
import { ProjectCommand } from '../base.ts'
import type { Step } from '../audit/main.ts'

const stepNames: readonly Step[] = ['html', 'dom', 'sass', 'lighthouse']

const isStep = (name: string): name is Step =>
	(stepNames as readonly string[]).includes(name)

export default class Audit extends ProjectCommand {
	static override summary = 'Audit the build: every step, or only the ones named'
	static override description =
		'Steps: html (W3C Nu checker, needs Java 11+), dom (elements per page), sass (uncompiled Sass in the CSS), lighthouse (every page in Chrome). Builds the project first unless --no-build.'
	static override examples = [
		'<%= config.bin %> <%= command.id %>',
		'<%= config.bin %> <%= command.id %> lighthouse --runs 1',
		'<%= config.bin %> <%= command.id %> html dom sass',
	]
	static override strict = false
	static override args = {
		steps: Args.string({
			description: `steps to run: ${stepNames.join(', ')} (default: all)`,
			ignoreStdin: true,
		}),
	}
	static override flags = {
		build: Flags.boolean({
			description:
				'build the project first; --no-build audits the dist already there',
			default: true,
			allowNo: true,
		}),
		runs: Flags.integer({
			description: 'Lighthouse runs per page, the median is kept',
			min: 1,
		}),
	}

	async run() {
		const { argv, flags } = await this.parse(Audit)
		const named = (argv as string[]).filter(arg => !arg.startsWith('--project'))
		const unknown = named.filter(name => !isStep(name))
		if (unknown.length > 0) {
			this.error(
				`unknown step ${unknown.join(', ')}; steps are ${stepNames.join(', ')}`,
			)
		}
		const { audit } = await import('../audit/main.ts')
		process.exitCode = await audit({
			steps: named.length > 0 ? named.filter(isStep) : stepNames,
			fresh: flags.build,
			runs: flags.runs,
		})
	}
}

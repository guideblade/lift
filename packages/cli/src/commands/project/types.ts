import {
	copyFileSync,
	existsSync,
	readFileSync,
	readdirSync,
	rmdirSync,
	unlinkSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { Flags } from '@oclif/core'
import { ProjectCommand } from '../../base.ts'
import { project, rel } from '../../project.ts'

const typesFile = 'lift.d.ts'

const same = (a: string, b: string) =>
	existsSync(b) && readFileSync(a, 'utf8') === readFileSync(b, 'utf8')

export default class ProjectTypes extends ProjectCommand {
	static override summary = "Write the types of the project's contract into lift.d.ts"
	static override description =
		'The project uses them as the global `Lift` namespace, so it never imports from the CLI.'
	static override flags = {
		check: Flags.boolean({
			description: 'only report whether lift.d.ts is up to date',
		}),
	}

	async run() {
		const { flags } = await this.parse(ProjectTypes)
		const { root, contract, adapter } = project()
		const target = join(root, typesFile)
		const legacy = join(root, '.lift', typesFile)
		if (flags.check) {
			const file = existsSync(target) || !existsSync(legacy) ? target : legacy
			const fresh = same(adapter.types, file)
			this.log(
				fresh
					? `${rel(file)} matches contract ${contract}`
					: `${rel(file)} is out of date, run \`lift project types\``,
			)
			process.exitCode = fresh ? 0 : 1
			return
		}
		copyFileSync(adapter.types, target)
		if (existsSync(legacy)) {
			unlinkSync(legacy)
			const dir = dirname(legacy)
			if (readdirSync(dir).length === 0) {
				rmdirSync(dir)
			}
		}
		this.log(`Wrote ${rel(target)} for contract ${contract}`)
	}
}

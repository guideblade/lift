import { ProjectCommand } from '../../base.ts'
import { check } from '../../conventions/main.ts'
import { discover } from '../../layered/find.ts'
import { skills } from '../../layered/kinds.ts'

export default class SkillsCheck extends ProjectCommand {
	static override summary = 'Run the project’s conventions for its skill folders'

	override async run() {
		await this.parse(SkillsCheck)
		const { folders } = discover(skills)
		if (folders.length === 0) {
			this.log('No skill folders')
			return
		}
		process.exitCode = await check({
			paths: folders,
			hook: false,
			changed: false,
			rule: undefined,
			json: false,
		})
	}
}

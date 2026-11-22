import { ProjectCommand } from '../../base.ts'

export default class ConventionsList extends ProjectCommand {
	static override summary = 'Describe every _conventions rule in the project'

	async run() {
		await this.parse(ConventionsList)
		const { list } = await import('../../conventions/main.ts')
		await list()
	}
}

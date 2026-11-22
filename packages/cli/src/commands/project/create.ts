import { Args } from '@oclif/core'
import { ProjectCommand, projectFlagOf } from '../../base.ts'
import { generateProject } from '../../generate/project.ts'

export default class ProjectCreate extends ProjectCommand {
	static override summary =
		'Create a project by copying the template, or the project --template names'
	static override description =
		'Copies the template project into a sibling folder in two commits, a copy and a merge, so `git blame` follows every line back through the source. Records the source package and commit as `template` in the new lift.config.ts. The source project must be committed; unrelated workspace changes are allowed.'
	static override examples = [
		'<%= config.bin %> <%= command.id %> my-site',
		'<%= config.bin %> <%= command.id %> blog --template packages/my-site',
	]
	static override baseFlags = {
		template: projectFlagOf('template', 'the project to copy'),
	}

	protected override opens = 'template'

	static override args = {
		name: Args.string({
			description: 'project-name, also the folder name',
			required: true,
		}),
	}

	async run() {
		const { args } = await this.parse(ProjectCreate)
		const { name, source, target, from } = await generateProject(args.name)
		this.log(`Created ${target} from ${source} at ${from}`)
		this.log(`Next: pnpm install, then pnpm --filter ${name} dev`)
	}
}

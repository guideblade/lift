import { Command, Flags, type Interfaces } from '@oclif/core'
import { flagValue, openProject, projectPath } from './project.ts'

export const projectFlagOf = (name: string, role: string) =>
	Flags.string({
		description: `${role}: a project name, folder, or lift.aliases name${name === 'project' ? ' (default: nearest project, then the project alias)' : ` (default: the ${name} alias)`}`,
		helpGroup: 'GLOBAL',
	})

export abstract class ProjectCommand extends Command {
	static override baseFlags: Interfaces.FlagInput = {
		project: projectFlagOf('project', 'the Lift project to work on'),
	}

	protected opens = 'project'

	override async init() {
		await super.init()
		await openProject(projectPath(this.opens, flagValue(this.argv, this.opens)))
	}
}

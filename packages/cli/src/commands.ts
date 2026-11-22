import Audit from './commands/audit.ts'
import BriefsCheck from './commands/briefs/check.ts'
import BriefsList from './commands/briefs/list.ts'
import BriefsRead from './commands/briefs/read.ts'
import Check from './commands/check.ts'
import ConventionsCheck from './commands/conventions/check.ts'
import ConventionsList from './commands/conventions/list.ts'
import ProjectCreate from './commands/project/create.ts'
import ProjectTypes from './commands/project/types.ts'
import SkillsCheck from './commands/skills/check.ts'
import SkillsCreate from './commands/skills/create.ts'
import SkillsList from './commands/skills/list.ts'
import SkillsRead from './commands/skills/read.ts'
import { projectCommands } from './project-commands.ts'

const builtIn = {
	audit: Audit,
	'briefs:check': BriefsCheck,
	'briefs:list': BriefsList,
	'briefs:read': BriefsRead,
	check: Check,
	'conventions:check': ConventionsCheck,
	'conventions:list': ConventionsList,
	'project:create': ProjectCreate,
	'project:types': ProjectTypes,
	'skills:check': SkillsCheck,
	'skills:create': SkillsCreate,
	'skills:list': SkillsList,
	'skills:read': SkillsRead,
}

export default {
	...(await projectCommands(process.argv.slice(2))),
	...builtIn,
}

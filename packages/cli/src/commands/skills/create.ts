import { existsSync, realpathSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { Args, Flags } from '@oclif/core'
import { stringify } from 'yaml'
import { ProjectCommand } from '../../base.ts'
import { run } from '../../conventions/run.ts'
import { Transaction } from '../../lib/files.ts'
import { fail, isWithin, rel, root } from '../../project.ts'

function scopeDir(path: string) {
	const dir = resolve(root(), path)
	if (!isWithin(dir, root()) || !existsSync(dir) || !statSync(dir).isDirectory()) {
		return fail('Skill scope must be an existing directory within the project')
	}
	if (!isWithin(realpathSync(dir), realpathSync(root()))) {
		return fail('Skill scope must resolve within the project')
	}
	return dir
}

function conventions(entry: string, shared: string, rule: string) {
	const source = relative(entry, shared).split(sep).join('/')
	return `import { ${rule} } from '${source}'\n\nexport default ${rule}\n`
}

export default class SkillsCreate extends ProjectCommand {
	static override summary = 'Create a skill piece and its folder-local conventions'
	static override args = {
		name: Args.string({ required: true, description: 'skill name' }),
	}
	static override flags = {
		path: Flags.string({
			default: '.',
			description: 'directory this piece applies to',
		}),
		description: Flags.string({
			required: true,
			description: 'what the piece does and when it applies',
		}),
	}

	override async run() {
		const {
			args: { name },
			flags,
		} = await this.parse(SkillsCreate)
		const description = flags.description.trim()
		if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name) || !description) {
			return fail('Provide a kebab-case skill name and a nonempty description')
		}
		const shared = join(root(), '_conventions', 'skills.ts')
		if (!existsSync(shared)) {
			return fail(
				'This project needs shared skill conventions in _conventions/skills.ts',
			)
		}
		const dir = join(scopeDir(flags.path), '_skills')
		if (existsSync(dir)) {
			scopeDir(dir)
		}
		const piece = join(dir, name)
		if (existsSync(piece)) {
			return fail(`Skill folder already exists: ${rel(piece)}`)
		}
		const collectionRules = join(dir, '_conventions')
		if (existsSync(collectionRules)) {
			scopeDir(collectionRules)
		}
		const pieceRules = join(piece, '_conventions')
		const files = new Transaction(root())
		try {
			if (!existsSync(join(collectionRules, 'index.ts'))) {
				await files.create(
					join(collectionRules, 'index.ts'),
					conventions(collectionRules, shared, 'skillFolders'),
				)
			}
			await files.create(
				join(piece, 'SKILL.md'),
				`---\n${stringify({ name, description, metadata: { reviewed: null } }, { indent: 4, lineWidth: 0 })}---\n\n# ${name.replaceAll('-', ' ')}\n`,
			)
			await files.create(
				join(pieceRules, 'index.ts'),
				conventions(pieceRules, shared, 'skillPiece'),
			)
			const problems = await run({ targets: [piece], only: null })
			if (problems.length) {
				fail(
					problems
						.map(problem => `${problem.file} ${problem.message}`)
						.join('\n'),
				)
			}
		} catch (error) {
			await files.rollback()
			throw error
		}
		this.log(`Created ${rel(join(piece, 'SKILL.md'))}`)
	}
}

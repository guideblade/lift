import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, posix, relative, resolve, sep } from 'node:path'
import { assertMissing } from '../lib/files.ts'
import { toKebab } from '../lib/names.ts'
import { configFile, fail, root } from '../project.ts'

type Git = (args: string[], input?: string) => string

const gitIn =
	(cwd: string, env: NodeJS.ProcessEnv = process.env): Git =>
	(args, input) =>
		execFileSync('git', args, { cwd, env, input, encoding: 'utf8' }).trim()

function renamePackage(content: string, name: string) {
	const field = /"name":\s*"[^"]*"/
	return field.test(content)
		? content.replace(field, `"name": "${name}"`)
		: fail('package.json of the source has no "name" to replace')
}

function recordTemplate(content: string, template: { from: string; commit: string }) {
	const entry = (indent: string) =>
		[
			`${indent}template: {`,
			`${indent}\tfrom: '${template.from}',`,
			`${indent}\tcommit: '${template.commit}',`,
			`${indent}},`,
		].join('\n')
	const existing = /^([ \t]*)template:\s*(?:\{[^}]*\}|'[^']*'),?[ \t]*$/m
	if (existing.test(content)) {
		return content.replace(existing, (_, indent: string) => entry(indent))
	}
	const contract = /^([ \t]*)contract:.*$/m
	return contract.test(content)
		? content.replace(contract, (line, indent: string) => `${line}\n${entry(indent)}`)
		: fail(`${configFile} of the source has no \`contract\` line`)
}

function stage(
	git: Git,
	paths: { from: string; to: string },
	edit: (content: string) => string,
) {
	const blob = git(
		['hash-object', '-w', '--stdin'],
		`${edit(git(['show', `HEAD:${paths.from}`]))}\n`,
	)
	git(['update-index', '--cacheinfo', `100644,${blob},${paths.to}`])
}

function locate(name: string) {
	const kebab = toKebab(name)
	if (!kebab) {
		return fail('Project name must contain at least one letter or number.')
	}
	const repo = resolve(gitIn(root())(['rev-parse', '--show-toplevel']))
	const source = relative(repo, root()).split(sep).join('/')
	if (!source) {
		return fail(
			'The project is the repository root, there is no folder to copy it next to.',
		)
	}
	return { kebab, repo, source, target: posix.join(posix.dirname(source), kebab) }
}

function assertReady(git: Git, source: string, target: string) {
	if (git(['status', '--porcelain', '--', source, target])) {
		fail(
			`The source or target project has changes: commit or stash changes in ${source} and ${target} first.`,
		)
	}
	if (!git(['ls-tree', '-d', 'HEAD', source])) {
		fail(`${source} is not committed`)
	}
	if (git(['ls-tree', 'HEAD', target])) {
		fail(`${target} already exists in HEAD`)
	}
}

function commitCopy(
	repo: string,
	paths: { source: string; target: string; name: string },
) {
	const { source, target, name } = paths
	const indexDir = mkdtempSync(join(tmpdir(), 'lift-project-'))
	const git = gitIn(repo, { ...process.env, GIT_INDEX_FILE: join(indexDir, 'index') })
	try {
		const head = git(['rev-parse', 'HEAD'])
		git(['read-tree', 'HEAD'])
		git(['read-tree', `--prefix=${target}/`, `HEAD:${source}`])
		const file = (path: string) => ({
			from: `${source}/${path}`,
			to: `${target}/${path}`,
		})
		stage(git, file('package.json'), content => renamePackage(content, name))
		const template = { from: posix.basename(source), commit: head }
		stage(git, file(configFile), content => recordTemplate(content, template))
		const both = git(['write-tree'])
		git(['rm', '--cached', '-r', '-q', source])
		const copy = git([
			'commit-tree',
			git(['write-tree']),
			'-p',
			head,
			'-m',
			`copy ${source} into ${target}`,
		])
		return {
			head,
			merge: git([
				'commit-tree',
				both,
				'-p',
				head,
				'-p',
				copy,
				'-m',
				`create project ${name}`,
			]),
		}
	} finally {
		rmSync(indexDir, { recursive: true, force: true })
	}
}

export async function generateProject(name: string) {
	const { kebab, repo, source, target } = locate(name)
	const git = gitIn(repo)
	await assertMissing(
		resolve(repo, target),
		`Refusing to overwrite existing folder: ${target}`,
	)
	assertReady(git, source, target)
	const { head, merge } = commitCopy(repo, { source, target, name: kebab })
	git(['merge', '--ff-only', '-q', merge])
	return { name: kebab, source, target, from: head.slice(0, 7) }
}

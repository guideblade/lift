import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { findRoot, openProject, root } from '../project.ts'

const git = (cwd: string, ...command: string[]) =>
	execFileSync('git', command, { cwd, encoding: 'utf8' }).split('\n').filter(Boolean)

export function changedFiles() {
	const top = git(root(), 'rev-parse', '--show-toplevel')[0] ?? root()
	return [
		...git(root(), 'diff', '--name-only', 'HEAD').map(file => resolve(top, file)),
		...git(root(), 'ls-files', '--others', '--exclude-standard').map(file =>
			resolve(root(), file),
		),
	]
}

export function trackedFiles(folder: string) {
	return git(
		root(),
		'ls-files',
		'--cached',
		'--others',
		'--exclude-standard',
		'--',
		folder || '.',
	).map(file => resolve(root(), file))
}

export async function hookFile() {
	let input = ''
	for await (const chunk of process.stdin) {
		input += chunk
	}
	const file = (JSON.parse(input || '{}') as { tool_input?: { file_path?: string } })
		.tool_input?.file_path
	if (!file || !findRoot(dirname(resolve(file)))) {
		return null
	}
	await openProject(dirname(resolve(file)))
	return resolve(file)
}

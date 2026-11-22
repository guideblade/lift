import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const project = fileURLToPath(new URL('..', import.meta.url))

function packageName(dir: string) {
	const { name } = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
		name: string
	}
	return name
		.replace(/^@[^/]+\//, '')
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 63)
}

function workspace(dir: string): string | null {
	if (existsSync(join(dir, 'pnpm-workspace.yaml'))) {
		return dir
	}
	const parent = dirname(dir)
	return parent === dir ? null : workspace(parent)
}

const [command = 'dev', ...args] = process.argv.slice(2)
if (command !== 'dev' && command !== 'preview') {
	throw new Error(`Unknown server command: ${command}`)
}

let serverArgs: string[]
if (
	command === 'preview' &&
	args.some(arg => arg === '--port' || arg.startsWith('--port='))
) {
	const cli = fileURLToPath(
		new URL('./bin/astro.mjs', import.meta.resolve('astro/package.json')),
	)
	serverArgs = [cli, command, ...args]
} else {
	const root = workspace(project)
	const name = [packageName(project), root && packageName(root)]
		.filter(Boolean)
		.join('.')
	const cli = fileURLToPath(new URL('./cli.js', import.meta.resolve('portless')))
	serverArgs = [cli, 'run', '--name', name, 'astro', command, ...args]
}

const result = spawnSync(process.execPath, serverArgs, {
	cwd: project,
	stdio: 'inherit',
})
if (result.error) {
	throw result.error
}
process.exitCode = result.status ?? 1

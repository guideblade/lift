import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const mode = args[0]
const unit = fileURLToPath(
	new URL('./vitest.mjs', import.meta.resolve('vitest/package.json')),
)
const e2e = fileURLToPath(
	new URL('./cli.js', import.meta.resolve('@playwright/test/package.json')),
)

const commands = []
if (mode !== '--e2e') {
	commands.push([unit, 'run', ...(mode === '--unit' ? args.slice(1) : [])])
}
if (mode !== '--unit') {
	commands.push([e2e, 'test', ...(mode === '--e2e' ? args.slice(1) : args)])
}

for (const command of commands) {
	const result = spawnSync(process.execPath, command, { stdio: 'inherit' })
	if (result.error) {
		throw result.error
	}
	process.exitCode = result.status ?? 1
	if (process.exitCode !== 0) {
		break
	}
}

import { spawnSync } from 'node:child_process'

const commands = [
	'pnpm run format:check',
	'pnpm run lint:check',
	'pnpm run test:unit',
	'pnpm run build',
	'pnpm run lift project types --check',
	'pnpm run lift conventions check',
	'pnpm run lift skills check',
	'pnpm run lift briefs check',
	'pnpm run lift audit html dom sass --no-build',
]

const result = spawnSync(commands.join(' && '), {
	shell: true,
	stdio: 'inherit',
})
if (result.error) {
	throw result.error
}
process.exitCode = result.status ?? 1

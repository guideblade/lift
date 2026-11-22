import { spawnSync } from 'node:child_process'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
	options: {
		check: { type: 'boolean' },
	},
})
const fix = values.check ? '' : ' --fix'
const commands = [
	'oxlint --deny-warnings',
	'markdownlint-cli2',
	'stylelint "src/**/*.{css,scss,astro}"',
]

const result = spawnSync(commands.map(command => command + fix).join(' && '), {
	shell: true,
	stdio: 'inherit',
})
if (result.error) {
	throw result.error
}
process.exitCode = result.status ?? 1

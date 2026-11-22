import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function getMode(): string {
	const args = process.argv.slice(2)
	const inline = args.find(arg => arg.startsWith('--mode='))
	if (inline) {
		return inline.slice('--mode='.length)
	}

	const index = args.indexOf('--mode')
	if (index !== -1 && args[index + 1]) {
		return args[index + 1]
	}

	return args.includes('dev') ? 'development' : 'production'
}

export function getGitCommit(): string {
	try {
		return execSync('git rev-parse HEAD', {
			stdio: ['ignore', 'pipe', 'ignore'],
		})
			.toString()
			.trim()
	} catch {
		return 'local'
	}
}

export function getProjectName(): string {
	try {
		const pkgPath = resolve(
			fileURLToPath(new URL('../../package.json', import.meta.url)),
		)
		const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
		return pkg.name || 'lift'
	} catch {
		return 'lift'
	}
}

export const aliases = {
	'@': fileURLToPath(new URL('../../src', import.meta.url)),
	'@site': fileURLToPath(new URL('../../src/site', import.meta.url)),
	'@primitives': fileURLToPath(
		new URL('../../src/components/primitives', import.meta.url),
	),
	'@blocks': fileURLToPath(new URL('../../src/components/blocks', import.meta.url)),
	'@presets': fileURLToPath(new URL('../../src/components/presets', import.meta.url)),
	'@behaviors': fileURLToPath(new URL('../../src/behaviors', import.meta.url)),
	'@services': fileURLToPath(new URL('../../src/services/index.ts', import.meta.url)),
	'@libs': fileURLToPath(new URL('../../src/libs', import.meta.url)),
	'@widgets': fileURLToPath(new URL('../../src/components/widgets', import.meta.url)),
	'@styles': fileURLToPath(new URL('../../src/libs/styles', import.meta.url)),
	'@config': fileURLToPath(
		new URL('../../src/site/config/site.config.ts', import.meta.url),
	),
}

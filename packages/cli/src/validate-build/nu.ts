import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

export type NuLevel = 'error' | 'warning'

export type NuMessage = {
	file: string
	line: number | null
	column: number | null
	level: NuLevel
	text: string
}

type Raw = {
	type: 'error' | 'info' | 'non-document-error'
	subType?: string
	url?: string
	firstLine?: number
	lastLine?: number
	firstColumn?: number
	message: string
}

const require = createRequire(import.meta.url)
const jar = String(require('vnu-jar'))
const { resolveJava } = require('vnu-jar/vnu-java-downloader.js') as {
	resolveJava: () => Promise<string>
}

const level = (raw: Raw): NuLevel | null => {
	if (raw.type !== 'info') {
		return 'error'
	}
	return raw.subType === 'warning' ? 'warning' : null
}

const toMessage = (raw: Raw): NuMessage | null => {
	const found = level(raw)
	if (!found) {
		return null
	}
	return {
		file: raw.url ? fileURLToPath(raw.url) : '',
		line: raw.firstLine ?? raw.lastLine ?? null,
		column: raw.firstColumn ?? null,
		level: found,
		text: raw.message,
	}
}

export async function nu(dir: string): Promise<NuMessage[]> {
	const result = spawnSync(
		await resolveJava(),
		['-jar', jar, '--format', 'json', '--stdout', '--skip-non-html', dir],
		{ encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 },
	)
	if (result.error) {
		throw result.error
	}
	if (!result.stdout) {
		throw new Error(result.stderr || `vnu exited with ${result.status}`)
	}
	const { messages } = JSON.parse(result.stdout) as { messages: Raw[] }
	return messages.map(toMessage).filter(message => message !== null)
}

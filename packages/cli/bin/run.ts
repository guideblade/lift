#!/usr/bin/env node
import { execute } from '@oclif/core'
import workspace from '../../../package.json' with { type: 'json' }

const leading: string[] = []
while (/^--(?:project|template)(?:=|$)/.test(process.argv[2] ?? '')) {
	const flag = process.argv.splice(2, 1)[0] ?? ''
	leading.push(flag)
	if (!flag.includes('=') && process.argv[2] && !process.argv[2].startsWith('-')) {
		leading.push(...process.argv.splice(2, 1))
	}
}
const separator = process.argv.indexOf('--', 2)
process.argv.splice(separator === -1 ? process.argv.length : separator, 0, ...leading)

await execute({ loadOptions: { root: import.meta.filename, version: workspace.version } })

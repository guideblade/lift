import { deriveInstanceName } from '../../src/libs/instance/derive-instance-name/deriveInstanceName'
import { servicePlugins } from '../../src/services/build'
import { iconPlugin } from '../../src/components/primitives/icon/lib/plugin'
import { photoPlugin } from '../../src/components/blocks/photo/lib/plugin'
import { blockName } from './scss'

const instanceClass = /(class\s+(Instance|Manager)\w+\s+extends\s[^{]*\{)/

export function instanceNamePlugin() {
	return {
		name: 'instance-name-auto-derive',
		transform(code: string, id: string) {
			const file = id.split(/[/\\]/).pop()?.split('?')[0] ?? ''
			const match = file.match(/^(Instance|Manager)\w+\.ts$/)
			if (!match || !instanceClass.test(code)) {
				return null
			}

			const kind = match[1] === 'Instance' ? 'instance' : 'manager'
			const instanceName = deriveInstanceName(file, kind)

			return {
				code: code.replace(
					instanceClass,
					`$1\n  static instanceName = '${instanceName}';`,
				),
				map: null,
			}
		},
	}
}

const blockNameId = 'block:name'
const blockNamePrefix = '\0block-name:'

export function blockNamePlugin() {
	return {
		name: 'block-name',
		resolveId(id: string, importer?: string) {
			if (id !== blockNameId || !importer) {
				return null
			}

			return `${blockNamePrefix}${blockName(importer)}`
		},
		load(id: string) {
			if (!id.startsWith(blockNamePrefix)) {
				return null
			}

			return `export const name = '${id.slice(blockNamePrefix.length)}'`
		},
	}
}

export const liftPlugins = [
	instanceNamePlugin(),
	blockNamePlugin(),
	iconPlugin(),
	photoPlugin(),
	...servicePlugins,
]

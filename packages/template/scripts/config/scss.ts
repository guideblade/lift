import { config } from '../../src/site/config/site.config.ts'
import { DataAttribute } from '../../src/libs/attributes/data-attribute/dataAttribute'
import { InstanceState } from '../../src/libs/instance/instance-state/instanceState'
import {
	serviceDataAttributes,
	serviceSassConfig,
	serviceSassImporters,
} from '../../src/services/build'

const scssDevicesMap = `$devices: (\n${Object.entries(config.devices)
	.map(([k, v]) => `\t${k}: ${v}rem,`)
	.join('\n')}\n);\n`

const scssInstanceStatesMap = `$instance-states: (\n${Object.entries(InstanceState)
	.map(([k, v]) => `\t${k}: '${v}',`)
	.join('\n')}\n);\n`

const toKebab = (key: string) => key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

export const blockName = (file: string) =>
	toKebab((file.split(/[/\\]/).pop() ?? '').split('?')[0].replace(/\..*$/, ''))

const dataAttributes = [...Object.values(DataAttribute), ...serviceDataAttributes]

const scssDataAttributesMap = `$data-attributes: (\n${dataAttributes
	.map(value => `\t${value.replace(/^data-/, '')}: '${value}',`)
	.join('\n')}\n);\n`

const scssBemMap = `$bem: (\n${Object.entries(config.bem)
	.map(([k, v]) => `\t${k}: '${v}',`)
	.join('\n')}\n);\n`

const scssFluidModule = [
	`$fluid-design-width: ${config.fluid.designWidth};`,
	`$fluid-share: ${config.fluid.share};`,
	`$fluid-max-scale: ${config.fluid.maxScale};`,
].join('\n')

const configModules: Record<string, string> = {
	devices: scssDevicesMap,
	fluid: scssFluidModule,
	'instance-states': scssInstanceStatesMap,
	'data-attributes': scssDataAttributesMap,
	bem: scssBemMap,
	...serviceSassConfig,
}

export const scssOptions = {
	importers: [
		...serviceSassImporters,
		{
			nonCanonicalScheme: 'config',
			canonicalize(url: string) {
				const key = url.replace(/^config:/, '')
				if (!url.startsWith('config:') || !(key in configModules)) {
					return null
				}
				return new URL(`config-module:${key}`)
			},
			load(canonicalUrl: URL) {
				return {
					contents: configModules[canonicalUrl.pathname],
					syntax: 'scss' as const,
				}
			},
		},
		{
			nonCanonicalScheme: 'block',
			canonicalize(url: string, context: { containingUrl: URL | null }) {
				if (url !== 'block:name') {
					return null
				}

				const from = context.containingUrl?.pathname
				if (!from) {
					throw new Error(
						"'block:name' requires a containing file to derive the name from.",
					)
				}

				return new URL(`block-name:${blockName(decodeURIComponent(from))}`)
			},
			load(canonicalUrl: URL) {
				return {
					contents: `$name: '${canonicalUrl.pathname}';`,
					syntax: 'scss' as const,
				}
			},
		},
	],
}

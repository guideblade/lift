import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { validateAndParseSvg } from './svgValidator.ts'

export const ICON_DIR = 'src/assets/(icon)'
export const ICON_TYPES = 'src/components/primitives/icon/_generated/icons.ts'
export const ICON_SPRITE = '.cache/icon/sprite.svg'

const iconName = /^icon-[a-z0-9]+(-[a-z0-9]+)*$/

function escapeAttribute(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

export function iconNames(root: string) {
	const dir = resolve(root, ICON_DIR)
	if (!existsSync(dir)) {
		return []
	}
	return readdirSync(dir, { withFileTypes: true })
		.filter(entry => entry.isFile() && entry.name.endsWith('.svg'))
		.map(entry => entry.name.replace(/\.svg$/, ''))
		.map(name => {
			if (!iconName.test(name)) {
				throw new Error(
					`[Icon] "${name}.svg" must be named icon-<name>.svg, with lowercase letters, digits and single dashes.`,
				)
			}
			return name
		})
		.sort()
}

export function iconTypes(names: readonly string[]) {
	return [
		'export const AVAILABLE_ICONS = [',
		...names.map(name => `\t'${name}',`),
		'] as const',
		'',
		'export type IconName = (typeof AVAILABLE_ICONS)[number]',
		'',
	].join('\n')
}

function toSymbol(name: string, rawSvg: string): string {
	const { attributes, innerHtml } = validateAndParseSvg(name, rawSvg)
	const attrs = Object.entries(attributes)
		.filter(([key]) => !/^xmlns(:|$)/i.test(key))
		.map(([key, value]) => ` ${key}="${escapeAttribute(value)}"`)
		.join('')
	return `\t<symbol id="${name}"${attrs}>${innerHtml.trim()}</symbol>`
}

export function iconSprite(root: string, names: readonly string[]) {
	const dir = resolve(root, ICON_DIR)
	return [
		'<svg xmlns="http://www.w3.org/2000/svg">',
		...names.map(name =>
			toSymbol(name, readFileSync(resolve(dir, `${name}.svg`), 'utf8')),
		),
		'</svg>',
		'',
	].join('\n')
}

export function iconFiles(root: string) {
	const names = iconNames(root)
	iconSprite(root, names)
	return [
		{
			path: resolve(root, ICON_TYPES),
			source: resolve(root, ICON_DIR),
			content: iconTypes(names),
		},
	]
}

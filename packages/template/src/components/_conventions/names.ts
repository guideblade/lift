import { basename, dirname } from 'node:path'
import { lift } from '@/_conventions/lift.ts'
import { commandsFolder, groupFolder } from '@/_conventions/names.ts'

export const kebab = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/

export const astroFile = (scope: { pascal: string }) => `ui/${scope.pascal}.astro`

export const uiComponentName = (scope: Lift.Scope) => basename(dirname(scope.dir))

export const uiAstroFile = (scope: Lift.Scope) =>
	`${lift.toPascal(uiComponentName(scope))}.astro`

export const isKebab = (name: string) => kebab.test(name)
export const isGroup = (name: string) => groupFolder.test(name)
const groupText = (name: string) => name.slice(1, -1)

export const groupPrefix = (prefix: string, group: string) =>
	prefix ? `${prefix}-${groupText(group)}` : groupText(group)

const memberOf = (prefix: string, name: string) =>
	name === prefix || name.startsWith(`${prefix}-`)

export const groupFor = (prefix: string, groups: readonly string[], name: string) =>
	groups.find(group => isGroup(group) && memberOf(groupPrefix(prefix, group), name))

export const propsType = 'Props'
export const blueprintName = 'component'
export const blueprintVariants = ['plain', 'instance']

export const rootFiles = ['README.md', 'index.ts']
export const requiredRootFiles = ['index.ts']
export const rootFolders = [
	'ui',
	'model',
	'lib',
	'samples',
	'tests',
	'other',
	'_generated',
	commandsFolder,
]
export const requiredRootFolders = ['ui']

export const htmlTags: ReadonlySet<string> = new Set([
	'a',
	'abbr',
	'address',
	'area',
	'article',
	'aside',
	'audio',
	'b',
	'bdi',
	'bdo',
	'blockquote',
	'body',
	'br',
	'button',
	'canvas',
	'caption',
	'cite',
	'code',
	'col',
	'colgroup',
	'data',
	'datalist',
	'dd',
	'del',
	'details',
	'dfn',
	'dialog',
	'div',
	'dl',
	'dt',
	'em',
	'embed',
	'fieldset',
	'figcaption',
	'figure',
	'footer',
	'form',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'header',
	'hgroup',
	'hr',
	'i',
	'iframe',
	'img',
	'input',
	'ins',
	'kbd',
	'label',
	'legend',
	'li',
	'main',
	'map',
	'mark',
	'menu',
	'meter',
	'nav',
	'noscript',
	'object',
	'ol',
	'optgroup',
	'option',
	'output',
	'p',
	'picture',
	'pre',
	'progress',
	'q',
	'rp',
	'rt',
	'ruby',
	's',
	'samp',
	'search',
	'section',
	'select',
	'slot',
	'small',
	'source',
	'span',
	'strong',
	'sub',
	'summary',
	'sup',
	'table',
	'tbody',
	'td',
	'template',
	'textarea',
	'tfoot',
	'th',
	'thead',
	'time',
	'tr',
	'track',
	'u',
	'ul',
	'var',
	'video',
	'wbr',
])

export const instanceFiles = (pascal: string) => [
	`Instance${pascal}.ts`,
	`Manager${pascal}.ts`,
]

export const uiFiles = (name: string, pascal: string) => [
	`${pascal}.astro`,
	`${name}.scss`,
	'shared.scss',
	'mixins.scss',
]
export const uiFolders = ['variant']

export const variants = [
	'primary',
	'secondary',
	'tertiary',
	'quaternary',
	'quinary',
	'senary',
	'septenary',
	'octonary',
	'nonary',
	'denary',
]

export const [primarySample = 'primary'] = variants

export const samplesFile = 'index.ts'
export const samplesExport = 'samples'
export const sampleFile = 'index.ts'
export const sampleExport = 'sample'
export const slotSuffix = '.slot.astro'
export const defaultSlot = 'default'

export const breakpoints = ['small', 'medium', 'large']
export const queryMixins = ['cq', 'mq']
export const containerMixin = 'is-container'

export const styleHeader = (name: string) => [
	`@use '@styles/tools.scss' as *`,
	`@use './${name}.scss' as *`,
	`@use 'block:name' as block`,
]

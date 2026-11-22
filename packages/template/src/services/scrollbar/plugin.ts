import { config } from '../../site/config/site.config.ts'
import { escapeClassName } from '../../libs/bem/class-selector/classSelector.ts'
import {
	scrollbarCssOnlyNames,
	type ScrollbarNames,
	scrollbarNames,
} from './lib/scrollbarNames.ts'

const packageName = 'overlayscrollbars'
const scriptFile = /[/\\]overlayscrollbars[/\\]overlayscrollbars\.mjs$/
const styleFile = /[/\\]overlayscrollbars[/\\]styles[/\\]overlayscrollbars\.css$/
const constant = /^const (\w+) = (?:"([^"]*)"|`([^`]*)`);$/gm
const foreign = /^(os-|data-overlayscrollbars)/
const hostPositionRule = /\[data-overlayscrollbars\]\s*\{\s*position:\s*relative;\s*\}/

function lookup(names: ScrollbarNames, name: string): string | undefined {
	return names.classes[name] ?? names.attributes[name]
}

function fail(message: string): never {
	throw new Error(
		`[${packageName}] ${message}. Update src/services/scrollbar/lib/scrollbarNames.ts.`,
	)
}

function rewriteScript(code: string, names: ScrollbarNames): string {
	const values = new Map<string, string>()
	const found = new Set<string>()
	const output = code.replace(
		constant,
		(line, id: string, quoted?: string, template?: string) => {
			const value =
				quoted ??
				template?.replace(
					/\$\{(\w+)\}/g,
					(match, ref: string) => values.get(ref) ?? match,
				)
			if (value === undefined || value.includes('${')) {
				return line
			}
			values.set(id, value)
			const mapped = lookup(names, value)
			if (mapped) {
				found.add(value)
				return `const ${id} = ${JSON.stringify(mapped)};`
			}
			if (foreign.test(value)) {
				fail(`unknown name \`${value}\``)
			}
			return line
		},
	)
	const expected = [
		...Object.keys(names.classes),
		...Object.keys(names.attributes),
	].filter(name => !scrollbarCssOnlyNames.has(name) && name !== 'os-theme-dark')
	const missing = expected.filter(name => !found.has(name))
	if (missing.length > 0) {
		fail(`names not found: ${missing.join(', ')}`)
	}
	const selectorImport =
		"import { classSelector as __scrollbarClassSelector } from '@libs/bem';\n"
	return (selectorImport + output)
		.replace(/`\.\$\{(\w+)\}`/g, '__scrollbarClassSelector($1)')
		.replace(/"(os-[a-z-]+)"/g, (match, name: string) =>
			JSON.stringify(lookup(names, name) ?? fail(`unknown name \`${name}\``)),
		)
		.replaceAll(names.variables[0], names.variables[1])
}

function rewriteStyle(css: string, names: ScrollbarNames): string {
	const [hostPosition] =
		css.match(hostPositionRule) ?? fail('host `position: relative` rule not found')
	return [
		`@layer base {\n${renameStyle(hostPosition, names)}\n}`,
		`@layer service {\n${renameStyle(css.replace(hostPositionRule, ''), names)}\n}`,
		'',
	].join('\n')
}

function renameStyle(css: string, names: ScrollbarNames): string {
	return css
		.replace(/\.(os-[a-z-]+)/g, (match, name: string) => {
			const mapped = names.classes[name] ?? fail(`unknown class \`${name}\``)
			return `.${escapeClassName(mapped)}`
		})
		.replace(/\[(data-overlayscrollbars[a-z-]*)/g, (match, name: string) => {
			const mapped = names.attributes[name] ?? fail(`unknown attribute \`${name}\``)
			return `[${mapped}`
		})
		.replaceAll(names.variables[0], names.variables[1])
		.replace(/\s*!important/g, '')
}

export default function scrollbarPlugin() {
	const names = scrollbarNames(config.bem)
	return {
		name: 'scrollbar-overlayscrollbars-names',
		enforce: 'pre' as const,
		config() {
			return { optimizeDeps: { exclude: [packageName] } }
		},
		transform(code: string, id: string) {
			const file = id.split('?')[0]
			if (scriptFile.test(file)) {
				return { code: rewriteScript(code, names), map: null }
			}
			if (styleFile.test(file)) {
				return { code: rewriteStyle(code, names), map: null }
			}
			return null
		},
	}
}

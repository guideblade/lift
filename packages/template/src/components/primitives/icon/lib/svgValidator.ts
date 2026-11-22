import { FORBIDDEN_COLOR_NAMES } from './colorList.ts'

export interface ParsedSvg {
	attributes: Record<string, string>
	innerHtml: string
}

const ALLOWED_COLORS = new Set(['none', 'currentcolor', 'inherit', 'transparent'])

function isForbiddenColor(val: string): boolean {
	const normalized = val.trim().toLowerCase()
	if (ALLOWED_COLORS.has(normalized)) {
		return false
	}
	if (
		normalized.startsWith('#') ||
		normalized.startsWith('rgb(') ||
		normalized.startsWith('rgba(') ||
		normalized.startsWith('hsl(') ||
		normalized.startsWith('hsla(')
	) {
		return true
	}
	return FORBIDDEN_COLOR_NAMES.has(normalized)
}

function checkStructureAndDimensions(name: string, trimmed: string): void {
	if (!trimmed.startsWith('<svg') || !trimmed.endsWith('</svg>')) {
		throw new Error(
			`[Icon] Icon "${name}" is invalid: must start with <svg and end with </svg>.`,
		)
	}
	if (/(?<!-)\b(width|height)\s*=/i.test(trimmed)) {
		throw new Error(
			`[Icon] Icon "${name}" is invalid: fixed width/height attributes are forbidden.`,
		)
	}
	if (/style\s*=\s*["'][^"']*(?<!-)\b(width|height)\s*:/i.test(trimmed)) {
		throw new Error(
			`[Icon] Icon "${name}" is invalid: width/height in inline style is forbidden.`,
		)
	}
	if (/\bid\s*=/i.test(trimmed)) {
		throw new Error(
			`[Icon] Icon "${name}" is invalid: id attributes are forbidden to prevent collision.`,
		)
	}
}

function checkColorAttributes(name: string, trimmed: string): void {
	const regex =
		/\b(fill|stroke|stop-color|flood-color|lighting-color)\s*=\s*["']([^"']+)["']/gi
	let match: RegExpExecArray | null
	while ((match = regex.exec(trimmed)) !== null) {
		if (isForbiddenColor(match[2])) {
			throw new Error(
				`[Icon] Icon "${name}" is invalid: hardcoded color "${match[2]}" is forbidden. Only currentColor or none is allowed.`,
			)
		}
	}
}

function checkStyleColors(name: string, trimmed: string): void {
	const styleRegex = /style\s*=\s*["']([^"']+)["']/gi
	let match: RegExpExecArray | null
	while ((match = styleRegex.exec(trimmed)) !== null) {
		const styleColorRegex = /\b(fill|stroke|color|stop-color)\s*:\s*([^;]+)/gi
		let sm: RegExpExecArray | null
		while ((sm = styleColorRegex.exec(match[1])) !== null) {
			if (isForbiddenColor(sm[2])) {
				throw new Error(
					`[Icon] Icon "${name}" is invalid: hardcoded style color "${sm[2]}" is forbidden.`,
				)
			}
		}
	}
}

function parseAttributes(raw: string): Record<string, string> {
	const attributes: Record<string, string> = {}
	const regex = /([a-zA-Z0-9_:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g
	let match: RegExpExecArray | null
	while ((match = regex.exec(raw)) !== null) {
		const name = match[1].toLowerCase()
		if (name !== 'class' && name !== 'id') {
			attributes[match[1]] = match[2] ?? match[3] ?? match[4] ?? ''
		}
	}
	return attributes
}

export function validateAndParseSvg(name: string, rawSvg: string): ParsedSvg {
	const trimmed = rawSvg.trim()
	checkStructureAndDimensions(name, trimmed)
	checkColorAttributes(name, trimmed)
	checkStyleColors(name, trimmed)

	const match = trimmed.match(/^<svg\b([^>]*)>/i)
	if (!match) {
		throw new Error(
			`[Icon] Icon "${name}" is invalid: cannot parse opening <svg> tag.`,
		)
	}

	return {
		attributes: parseAttributes(match[1]),
		innerHtml: trimmed.slice(match[0].length, -6),
	}
}

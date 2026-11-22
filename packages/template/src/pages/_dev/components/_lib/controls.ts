import type { DocProp } from '#docs'

export type Values = Record<string, unknown>

const switches = (prop: DocProp) => prop.kind === 'boolean' && !prop.optional

export const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

export function read(prop: DocProp, raw: string): unknown {
	if (switches(prop)) {
		return raw === 'true'
	}
	if (raw === '' && prop.optional) {
		return undefined
	}
	if (prop.kind === 'boolean') {
		return raw === 'true'
	}
	if (prop.kind === 'enum') {
		return prop.options[Number(raw)]
	}
	if (prop.kind === 'number') {
		return Number(raw)
	}
	return prop.kind === 'json' ? JSON.parse(raw) : raw
}

export function write(prop: DocProp, value: unknown): string {
	if (switches(prop)) {
		return String(value === true)
	}
	if (prop.kind === 'enum') {
		const index = prop.options.indexOf(value as string | number)
		return index >= 0 ? String(index) : prop.optional ? '' : '0'
	}
	if (prop.kind === 'json') {
		return value === undefined ? '' : JSON.stringify(value, null, 2)
	}
	return value === undefined || value === null ? '' : String(value)
}

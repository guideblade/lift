import { components, utilities } from 'virtual:lift-docs'
import type { DocEntry, DocSample } from '#docs'
import { sampleSlotsKey } from '@/_conventions/names.ts'

export { components, utilities }
export type { DocEntry, DocProp } from '#docs'

export const findEntry = (id: string | undefined) =>
	components.find(entry => entry.id === id)

const headlessTag = 'headless'

const isHeadless = (entry: DocEntry) =>
	entry.tags.some(tag => tag.toLowerCase() === headlessTag)

export const trail = (entry: DocEntry) => [entry.layer, ...entry.group].join(' / ')

export const headlessLabel = 'Headless'

export function sections() {
	const groups = new Map<string, DocEntry[]>()
	for (const entry of components) {
		const label = isHeadless(entry) ? headlessLabel : trail(entry)
		groups.set(label, [...(groups.get(label) ?? []), entry])
	}
	const headless = groups.get(headlessLabel)
	groups.delete(headlessLabel)
	return [...groups, ...(headless ? [[headlessLabel, headless] as const] : [])]
}

export async function samplesOf(entry: DocEntry): Promise<Record<string, DocSample>> {
	const loaded = entry.samples ? (await entry.samples()).samples : {}
	return Object.keys(loaded).length ? loaded : { default: entry.defaults }
}

const editable = (entry: DocEntry) =>
	new Set(entry.props.filter(prop => prop.kind !== 'none').map(prop => prop.name))

const pick = (values: Record<string, unknown>, keep: (key: string) => boolean) =>
	Object.fromEntries(Object.entries(values).filter(([key]) => keep(key)))

export function editableValues(entry: DocEntry, sample: DocSample) {
	const names = editable(entry)
	return pick(sample, key => names.has(key))
}

function parse(raw: string | null): Record<string, unknown> | null {
	try {
		return raw ? JSON.parse(raw) : null
	} catch {
		return null
	}
}

export function previewProps(entry: DocEntry, sample: DocSample, raw: string | null) {
	const { [sampleSlotsKey]: slots, ...values } = sample
	const names = editable(entry)
	const override = parse(raw)
	const props = override
		? { ...pick(values, key => !names.has(key)), ...override }
		: values
	return entry.sampleSlots ? { ...props, [sampleSlotsKey]: slots } : props
}

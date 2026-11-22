import type { AstroComponentFactory } from 'astro/runtime/server/index.js'
import type { sampleSlotsKey } from '../../src/_conventions/names.ts'

export type DocKind = 'boolean' | 'string' | 'number' | 'enum' | 'json' | 'none'

export type DocValue =
	| string
	| number
	| boolean
	| null
	| DocValue[]
	| { [key: string]: DocValue }

export type DocProp = {
	name: string
	type: string
	kind: DocKind
	options: Array<string | number>
	optional: boolean
	default: string | null
	description: string
}

export type DocMember = DocProp & { from: string; base: boolean }

export type DocMethod = {
	name: string
	description: string
	from: string
	base: boolean
	params: DocProp[]
	returns: string
}

export type DocApi = {
	name: string
	className: string
	state: DocMember[]
	values: DocMember[]
	methods: DocMethod[]
	events: string[]
}

export type DocCheck = { label: string; done: boolean }

export type DocMarks = { tags: string[]; checks: DocCheck[] }

export type DocMeta = DocMarks & {
	id: string
	title: string
	layer: string
	full: boolean
	group: string[]
	source: string
	props: DocProp[]
	slots: string[]
	defaults: Record<string, DocValue>
	sampleSlots: boolean
	instance: DocApi | null
	manager: DocApi | null
}

export type DocSample = Record<string, unknown> & {
	[K in typeof sampleSlotsKey]?: Partial<Record<string, AstroComponentFactory>>
}

export type DocEntry = DocMeta & {
	component: () => Promise<{ default: AstroComponentFactory }>
	samples: (() => Promise<{ samples: Record<string, DocSample> }>) | null
	readme: (() => Promise<{ Content: AstroComponentFactory }>) | null
}

export type DocsOptions = {
	roots: Record<string, { path: string; full: boolean }>
	text: string
	preferred: string
	preview: string
}

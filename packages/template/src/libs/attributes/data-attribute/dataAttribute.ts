import { createBlock } from '../../bem/create-block/createBlock'
import { InstanceState } from '../../instance/instance-state/instanceState'
import { getTraceToken } from '../../astro/trace-token/traceToken'

export const DataAttribute = {
	documentJs: 'data-document-js',
	componentRoot: 'data-component-root',
	componentName: 'data-component-name',
	instanceName: 'data-instance-name',
	instanceRequiresJs: 'data-instance-requires-js',
	instanceState: 'data-instance-state',
	origin: 'data-origin',
	pageState: 'data-page-state',
	hover: 'data-hover',
	hoverSource: 'data-hover-source',
} as const

export type DataAttribute = (typeof DataAttribute)[keyof typeof DataAttribute]

export const HoverMode = {
	auto: 'auto',
	self: 'self',
	parent: 'parent',
	off: 'off',
	on: 'on',
} as const

export type HoverMode = (typeof HoverMode)[keyof typeof HoverMode]

export function componentAttributes(
	name: string,
	{ hover, hoverSource }: { hover?: HoverMode; hoverSource?: boolean } = {},
) {
	return {
		[DataAttribute.componentRoot]: '',
		[DataAttribute.componentName]: name,
		...(hover && hover !== HoverMode.auto ? { [DataAttribute.hover]: hover } : {}),
		...(hoverSource ? { [DataAttribute.hoverSource]: '' } : {}),
	}
}

export function componentBlock(element: Element) {
	return createBlock(element.getAttribute(DataAttribute.componentName) ?? '')
}

export function originAttributes(pageId: string) {
	return { [DataAttribute.origin]: getTraceToken(pageId) }
}

export function instanceAttributes(block: string, options?: { requiresJs?: boolean }) {
	const name = block
		.split('-')
		.map(part => part.charAt(0).toUpperCase() + part.slice(1))
		.join('')

	return {
		[DataAttribute.instanceName]: name,
		[DataAttribute.instanceRequiresJs]: String(options?.requiresJs ?? true),
		[DataAttribute.instanceState]: InstanceState.unmounted,
	}
}

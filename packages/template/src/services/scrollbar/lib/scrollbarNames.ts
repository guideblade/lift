import { ServiceScrollbarAttribute } from './scrollbarAttribute'

export type ScrollbarBem = {
	element: string
	modifier: string
}

export type ScrollbarNames = {
	block: string
	classes: Record<string, string>
	attributes: Record<string, string>
	variables: [from: string, to: string]
}

const classParts: Record<string, [element: string, modifier?: string]> = {
	'os-scrollbar': ['rail'],
	'os-scrollbar-rtl': ['rail', 'rtl'],
	'os-scrollbar-horizontal': ['rail', 'horizontal'],
	'os-scrollbar-vertical': ['rail', 'vertical'],
	'os-scrollbar-visible': ['rail', 'visible'],
	'os-scrollbar-cornerless': ['rail', 'cornerless'],
	'os-scrollbar-interaction': ['rail', 'interaction'],
	'os-scrollbar-unusable': ['rail', 'unusable'],
	'os-scrollbar-auto-hide': ['rail', 'auto-hide'],
	'os-scrollbar-auto-hide-hidden': ['rail', 'auto-hide-hidden'],
	'os-scrollbar-wheel': ['rail', 'wheel'],
	'os-scrollbar-transitionless': ['rail', 'transitionless'],
	'os-theme-none': ['rail', 'theme-none'],
	'os-theme-dark': ['rail', 'theme-dark'],
	'os-theme-light': ['rail', 'theme-light'],
	'os-scrollbar-track': ['track'],
	'os-scrollbar-track-interactive': ['rail', 'track-interactive'],
	'os-scrollbar-handle': ['thumb'],
	'os-scrollbar-handle-interactive': ['rail', 'thumb-interactive'],
	'os-environment': ['environment'],
	'os-environment-scrollbar-hidden': ['environment', 'scrollbar-hidden'],
	'os-size-observer': ['size-observer'],
	'os-size-observer-appear': ['size-observer', 'appear'],
	'os-size-observer-listener': ['size-observer-listener'],
	'os-size-observer-listener-scroll': ['size-observer-listener', 'scroll'],
	'os-size-observer-listener-item': ['size-observer-item'],
	'os-size-observer-listener-item-final': ['size-observer-item', 'final'],
	'os-trinsic-observer': ['trinsic-observer'],
}

const attributes: Record<string, string> = {
	'data-overlayscrollbars': ServiceScrollbarAttribute.host,
	'data-overlayscrollbars-initialize': ServiceScrollbarAttribute.initialize,
	'data-overlayscrollbars-body': ServiceScrollbarAttribute.body,
	'data-overlayscrollbars-viewport': ServiceScrollbarAttribute.viewport,
	'data-overlayscrollbars-padding': ServiceScrollbarAttribute.padding,
	'data-overlayscrollbars-content': ServiceScrollbarAttribute.content,
	'data-overlayscrollbars-contents': ServiceScrollbarAttribute.contents,
	'data-overlayscrollbars-grid': ServiceScrollbarAttribute.grid,
}

export const scrollbarCssOnlyNames = new Set([
	'os-scrollbar-transitionless',
	'os-theme-dark',
	'os-theme-light',
	'data-overlayscrollbars-contents',
	'data-overlayscrollbars-grid',
])

export function scrollbarBlock(): string {
	return ServiceScrollbarAttribute.root.replace(/^data-/, '')
}

export function scrollbarNames(bem: ScrollbarBem): ScrollbarNames {
	const block = scrollbarBlock()
	const classes = Object.fromEntries(
		Object.entries(classParts).map(([name, [element, modifier]]) => {
			const base = `${block}${bem.element}${element}`
			return [name, modifier ? `${base}${bem.modifier}${modifier}` : base]
		}),
	)
	return { block, classes, attributes, variables: ['--os-', `--${block}-`] }
}

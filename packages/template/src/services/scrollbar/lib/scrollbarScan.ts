import { ServiceScrollbarMode, serviceScrollbarNative } from './scrollbarState'
import { ServiceScrollbarAttribute } from './scrollbarAttribute'

export type ScrollbarScope = {
	mode: ServiceScrollbarMode
	exclude: string
	own: string
}

const scrollable = new Set(['auto', 'scroll'])

export function isScrollContainer(element: Element): boolean {
	if (element === document.documentElement) {
		return true
	}
	if (element === document.body) {
		return false
	}
	const style = getComputedStyle(element)
	return scrollable.has(style.overflowX) || scrollable.has(style.overflowY)
}

export function scrollbarCandidates(root: Element, scope: ScrollbarScope): HTMLElement[] {
	const selector =
		scope.mode === ServiceScrollbarMode.optIn
			? `[${ServiceScrollbarAttribute.root}]`
			: '*'
	return [root, ...root.querySelectorAll(selector)].filter(
		(element): element is HTMLElement =>
			element instanceof HTMLElement && element.closest(scope.own) === null,
	)
}

export function isInScope(element: HTMLElement, scope: ScrollbarScope): boolean {
	const owner = element.closest(`[${ServiceScrollbarAttribute.root}]`)
	if (owner?.getAttribute(ServiceScrollbarAttribute.root) === serviceScrollbarNative) {
		return false
	}
	if (scope.mode === ServiceScrollbarMode.optIn) {
		return owner === element
	}
	return element === document.documentElement || !element.matches(scope.exclude)
}

export function supportsScrollTimeline(): boolean {
	return typeof CSS !== 'undefined' && CSS.supports('animation-timeline: scroll()')
}

import type { ScrollToOptions as LenisScrollToOptions } from 'lenis'

export type ServiceLenisTarget = number | string | HTMLElement

const startKeywords = new Set(['top', 'start', 'left'])
const endKeywords = new Set(['bottom', 'end', 'right'])

function scrollerOf(element: HTMLElement): Window | HTMLElement {
	return element === document.documentElement ? window : element
}

function currentOf(element: HTMLElement): number {
	return element === document.documentElement ? window.scrollY : element.scrollTop
}

function limitOf(element: HTMLElement): number {
	const viewport =
		element === document.documentElement ? window.innerHeight : element.clientHeight
	return element.scrollHeight - viewport
}

function resolveTop(target: ServiceLenisTarget, element: HTMLElement): number | null {
	if (typeof target === 'number') {
		return target
	}
	if (typeof target === 'string' && startKeywords.has(target)) {
		return 0
	}
	if (typeof target === 'string' && endKeywords.has(target)) {
		return limitOf(element)
	}
	const node = typeof target === 'string' ? document.querySelector(target) : target
	if (!node) {
		return null
	}
	const origin =
		element === document.documentElement ? 0 : element.getBoundingClientRect().top
	return node.getBoundingClientRect().top - origin + currentOf(element)
}

export function nativeScrollTo(
	target: ServiceLenisTarget,
	options: LenisScrollToOptions,
	element: HTMLElement,
): void {
	const top = resolveTop(target, element)
	if (top === null) {
		return
	}
	scrollerOf(element).scrollTo({
		top: top + (options.offset ?? 0),
		behavior: options.immediate ? 'instant' : 'smooth',
	})
}

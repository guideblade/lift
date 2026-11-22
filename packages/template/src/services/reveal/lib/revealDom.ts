import { ServiceRevealState, serviceRevealKeyframes } from './revealState'
import { ServiceRevealAttribute } from './revealAttribute'

export function getRevealState(element: Element): ServiceRevealState | null {
	return element.getAttribute(ServiceRevealAttribute.state) as ServiceRevealState | null
}

export function setRevealState(element: Element, state: ServiceRevealState): void {
	element.setAttribute(ServiceRevealAttribute.state, state)
}

export function isHidden(element: Element): boolean {
	return getRevealState(element) === ServiceRevealState.hidden
}

function offscreenSide(element: Element): 'above' | 'below' | null {
	const rect = element.getBoundingClientRect()
	if (rect.top > window.innerHeight) {
		return 'below'
	}
	return rect.bottom < 0 ? 'above' : null
}

export function offscreenState(
	element: Element,
	reset: Record<'above' | 'below', boolean>,
): ServiceRevealState | null {
	const hidden = isHidden(element)
	if (!reset.below && !reset.above && !hidden) {
		return null
	}
	const side = offscreenSide(element)
	if (!side) {
		return null
	}
	if (reset[side]) {
		return hidden ? null : ServiceRevealState.hidden
	}
	return hidden ? ServiceRevealState.visible : null
}

export function isRevealEnd(event: AnimationEvent): boolean {
	return (
		event.target === event.currentTarget &&
		event.animationName === serviceRevealKeyframes &&
		getRevealState(event.target as Element) === ServiceRevealState.entering
	)
}

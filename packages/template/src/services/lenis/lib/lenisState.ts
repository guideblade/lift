import Lenis from 'lenis'
import { ServiceLenisAttribute } from './lenisAttribute'

export const ServiceLenisState = {
	idle: 'idle',
	native: 'native',
	smooth: 'smooth',
	locked: 'locked',
	stopped: 'stopped',
} as const

export type ServiceLenisState = (typeof ServiceLenisState)[keyof typeof ServiceLenisState]

function stateOf(lenis: Lenis): ServiceLenisState {
	if (lenis.isStopped) {
		return ServiceLenisState.stopped
	}
	if (lenis.isLocked) {
		return ServiceLenisState.locked
	}
	if (lenis.isScrolling === 'smooth') {
		return ServiceLenisState.smooth
	}
	if (lenis.isScrolling === 'native') {
		return ServiceLenisState.native
	}
	return ServiceLenisState.idle
}

const lenisPrototype = Lenis.prototype as unknown as {
	updateClassName(this: Lenis): void
	cleanUpClassName(this: Lenis): void
}

lenisPrototype.updateClassName = function () {
	this.rootElement.setAttribute(ServiceLenisAttribute.state, stateOf(this))
}

lenisPrototype.cleanUpClassName = function () {
	this.rootElement.removeAttribute(ServiceLenisAttribute.state)
}

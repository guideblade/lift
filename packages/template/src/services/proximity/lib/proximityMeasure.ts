import {
	proximityRest,
	ServiceProximityState,
	type ServiceProximityValue,
} from './proximityState'

export interface ServiceProximityPointer {
	x: number
	y: number
}

function round(value: number): number {
	return Math.round(value * 1000) / 1000
}

function clamp(value: number): number {
	return Math.min(1, Math.max(-1, value))
}

function axis(pointer: number, start: number, size: number): number {
	const half = size / 2
	return half > 0 ? round(clamp((pointer - start - half) / half)) : 0
}

export function measureProximity(
	rect: DOMRect,
	pointer: ServiceProximityPointer | null,
	radius: number,
): ServiceProximityValue {
	if (!pointer) {
		return proximityRest
	}
	const dx = Math.max(rect.left - pointer.x, 0, pointer.x - rect.right)
	const dy = Math.max(rect.top - pointer.y, 0, pointer.y - rect.bottom)
	const distance = Math.hypot(dx, dy)
	if (distance > 0 && distance >= radius) {
		return proximityRest
	}
	return {
		state: distance === 0 ? ServiceProximityState.over : ServiceProximityState.near,
		value: distance === 0 ? 1 : round(1 - distance / radius),
		x: axis(pointer.x, rect.left, rect.width),
		y: axis(pointer.y, rect.top, rect.height),
	}
}

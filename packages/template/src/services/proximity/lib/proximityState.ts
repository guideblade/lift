export const ServiceProximityState = {
	far: 'far',
	near: 'near',
	over: 'over',
} as const

export type ServiceProximityState =
	(typeof ServiceProximityState)[keyof typeof ServiceProximityState]

export const ServiceProximityVariable = {
	value: '--service-proximity',
	x: '--service-proximity-x',
	y: '--service-proximity-y',
} as const

export interface ServiceProximityValue {
	state: ServiceProximityState
	value: number
	x: number
	y: number
}

export const proximityRest: ServiceProximityValue = {
	state: ServiceProximityState.far,
	value: 0,
	x: 0,
	y: 0,
}

export function isSameProximity(
	a: ServiceProximityValue,
	b: ServiceProximityValue,
): boolean {
	return a.state === b.state && a.value === b.value && a.x === b.x && a.y === b.y
}

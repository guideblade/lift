import { config } from '@config'
import { BaseService } from '@libs/service'
import { measureProximity, type ServiceProximityPointer } from './lib/proximityMeasure'
import {
	isSameProximity,
	proximityRest,
	ServiceProximityVariable,
	type ServiceProximityValue,
} from './lib/proximityState'
import { ServiceProximityAttribute } from './lib/proximityAttribute'
import './properties.scss'

export class ServiceProximity extends BaseService {
	public static override readonly serviceName = 'proximity'
	readonly #values = new Map<HTMLElement, ServiceProximityValue | null>()
	#media: MediaQueryList | null = null
	#observer: MutationObserver | null = null
	#pointer: ServiceProximityPointer | null = null
	#frame = 0

	public get enabled(): boolean {
		return config.services.proximity.enabled
	}

	public get active(): boolean {
		return this.#observer !== null
	}

	public get root(): HTMLElement {
		return document.documentElement
	}

	protected override onInit(): void {
		if (!this.enabled || typeof document === 'undefined') {
			return
		}
		this.#media = window.matchMedia(config.services.proximity.media)
		this.#media.addEventListener('change', this.toggle)
		this.toggle()
	}

	public get(element: HTMLElement): ServiceProximityValue {
		return this.#values.get(element) ?? proximityRest
	}

	public attach(element: HTMLElement, radius?: number): void {
		element.setAttribute(
			ServiceProximityAttribute.root,
			radius === undefined ? '' : String(radius),
		)
		this.sync()
	}

	public detach(element: HTMLElement): void {
		element.removeAttribute(ServiceProximityAttribute.root)
		this.sync()
	}

	public destroy(): void {
		this.#media?.removeEventListener('change', this.toggle)
		this.#media = null
		this.stop()
		ServiceProximity.resetInstance()
	}

	private readonly toggle = (): void => {
		if (this.#media?.matches) {
			this.start()
		} else {
			this.stop()
		}
	}

	private start(): void {
		if (this.active) {
			return
		}
		this.#observer = new MutationObserver(this.sync)
		this.#observer.observe(this.root, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: [ServiceProximityAttribute.root],
		})
		window.addEventListener('pointermove', this.move, { passive: true })
		window.addEventListener('scroll', this.schedule, { passive: true, capture: true })
		window.addEventListener('resize', this.schedule)
		this.root.addEventListener('pointerleave', this.leave)
		this.sync()
	}

	private stop(): void {
		this.#observer?.disconnect()
		this.#observer = null
		window.removeEventListener('pointermove', this.move)
		window.removeEventListener('scroll', this.schedule, { capture: true })
		window.removeEventListener('resize', this.schedule)
		this.root.removeEventListener('pointerleave', this.leave)
		cancelAnimationFrame(this.#frame)
		this.#frame = 0
		this.#pointer = null
		for (const element of [...this.#values.keys()]) {
			this.clear(element)
		}
	}

	private readonly sync = (): void => {
		if (!this.active) {
			return
		}
		const selector = `[${ServiceProximityAttribute.root}]`
		const elements = new Set(this.root.querySelectorAll<HTMLElement>(selector))
		if (this.root.matches(selector)) {
			elements.add(this.root)
		}
		for (const element of [...this.#values.keys()]) {
			if (!elements.has(element)) {
				this.clear(element)
			}
		}
		for (const element of elements) {
			if (!this.#values.has(element)) {
				this.#values.set(element, null)
			}
		}
		this.schedule()
	}

	private readonly move = (event: PointerEvent): void => {
		if (event.pointerType === 'touch') {
			return
		}
		this.#pointer = { x: event.clientX, y: event.clientY }
		this.schedule()
	}

	private readonly leave = (): void => {
		this.#pointer = null
		this.schedule()
	}

	private readonly schedule = (): void => {
		if (!this.#frame) {
			this.#frame = requestAnimationFrame(this.update)
		}
	}

	private readonly update = (): void => {
		this.#frame = 0
		const measured = [...this.#values.keys()].map(
			element =>
				[
					element,
					measureProximity(
						element.getBoundingClientRect(),
						this.#pointer,
						this.radiusOf(element),
					),
				] as const,
		)
		for (const [element, value] of measured) {
			this.write(element, value)
		}
	}

	private radiusOf(element: HTMLElement): number {
		const radius = Number.parseFloat(
			element.getAttribute(ServiceProximityAttribute.root) ?? '',
		)
		return Number.isFinite(radius) && radius >= 0
			? radius
			: config.services.proximity.radius
	}

	private write(element: HTMLElement, value: ServiceProximityValue): void {
		const previous = this.#values.get(element)
		if (previous && isSameProximity(previous, value)) {
			return
		}
		this.#values.set(element, value)
		element.style.setProperty(ServiceProximityVariable.value, String(value.value))
		element.style.setProperty(ServiceProximityVariable.x, String(value.x))
		element.style.setProperty(ServiceProximityVariable.y, String(value.y))
		element.setAttribute(ServiceProximityAttribute.state, value.state)
	}

	private clear(element: HTMLElement): void {
		this.#values.delete(element)
		for (const variable of Object.values(ServiceProximityVariable)) {
			element.style.removeProperty(variable)
		}
		if (!element.getAttribute('style')) {
			element.removeAttribute('style')
		}
		element.removeAttribute(ServiceProximityAttribute.state)
	}
}

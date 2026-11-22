import { config } from '@config'
import { BaseService } from '@libs/service'
import {
	getRevealState,
	isHidden,
	isRevealEnd,
	offscreenState,
	setRevealState,
} from './lib/revealDom'
import { ServiceRevealState, type ServiceRevealPreset } from './lib/revealState'
import { ServiceRevealAttribute } from './lib/revealAttribute'
import './elements.scss'

export class ServiceReveal extends BaseService {
	public static override readonly serviceName = 'reveal'
	readonly #elements = new Set<HTMLElement>()
	#media: MediaQueryList | null = null
	#mutations: MutationObserver | null = null
	#enter: IntersectionObserver | null = null
	#leave: IntersectionObserver | null = null
	#frame = 0

	public get enabled(): boolean {
		return config.services.reveal.enabled
	}

	public get active(): boolean {
		return this.#mutations !== null
	}

	public get root(): HTMLElement {
		return document.documentElement
	}

	protected override onInit(): void {
		if (!this.enabled || typeof document === 'undefined') {
			return
		}
		this.#media = window.matchMedia(config.services.reveal.reducedMotion)
		this.#media.addEventListener('change', this.toggle)
		this.toggle()
	}

	public get(element: HTMLElement): ServiceRevealState | null {
		return getRevealState(element)
	}

	public attach(element: HTMLElement, preset?: ServiceRevealPreset): void {
		element.setAttribute(ServiceRevealAttribute.root, preset ?? '')
		this.sync()
	}

	public detach(element: HTMLElement): void {
		element.removeAttribute(ServiceRevealAttribute.root)
		this.sync()
	}

	public destroy(): void {
		this.#media?.removeEventListener('change', this.toggle)
		this.#media = null
		this.stop()
		ServiceReveal.resetInstance()
	}

	private readonly toggle = (): void => {
		if (this.#media?.matches) {
			this.stop()
		} else {
			this.start()
		}
	}

	private start(): void {
		if (this.active) {
			return
		}
		this.#enter = new IntersectionObserver(this.entered, {
			rootMargin: config.services.reveal.rootMargin,
		})
		this.#leave = new IntersectionObserver(this.schedule)
		this.#mutations = new MutationObserver(this.sync)
		this.#mutations.observe(this.root, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: [ServiceRevealAttribute.root],
		})
		window.addEventListener('scroll', this.schedule, { passive: true, capture: true })
		this.sync()
	}

	private stop(): void {
		this.#mutations?.disconnect()
		this.#mutations = null
		window.removeEventListener('scroll', this.schedule, { capture: true })
		cancelAnimationFrame(this.#frame)
		this.#frame = 0
		for (const element of [...this.#elements]) {
			this.forget(element)
		}
		this.#enter?.disconnect()
		this.#enter = null
		this.#leave?.disconnect()
		this.#leave = null
	}

	private readonly sync = (): void => {
		if (!this.active) {
			return
		}
		const elements = new Set(
			this.root.querySelectorAll<HTMLElement>(`[${ServiceRevealAttribute.root}]`),
		)
		for (const element of [...this.#elements]) {
			if (!elements.has(element)) {
				this.forget(element)
			}
		}
		for (const element of elements) {
			if (!this.#elements.has(element)) {
				this.track(element)
			}
		}
	}

	private track(element: HTMLElement): void {
		this.#elements.add(element)
		element.addEventListener('animationend', this.settle)
		element.addEventListener('animationcancel', this.settle)
		if (!getRevealState(element)) {
			setRevealState(element, ServiceRevealState.hidden)
		}
		this.#enter?.observe(element)
		this.#leave?.observe(element)
	}

	private forget(element: HTMLElement): void {
		this.#elements.delete(element)
		element.removeEventListener('animationend', this.settle)
		element.removeEventListener('animationcancel', this.settle)
		this.#enter?.unobserve(element)
		this.#leave?.unobserve(element)
		element.removeAttribute(ServiceRevealAttribute.state)
	}

	private readonly entered = (entries: IntersectionObserverEntry[]): void => {
		for (const entry of entries) {
			if (entry.isIntersecting && isHidden(entry.target)) {
				setRevealState(entry.target, ServiceRevealState.entering)
				this.release(entry.target)
			}
		}
	}

	private readonly schedule = (): void => {
		if (!this.#frame) {
			this.#frame = requestAnimationFrame(this.sweep)
		}
	}

	private readonly sweep = (): void => {
		this.#frame = 0
		const { once, mirror } = config.services.reveal
		const reset = { below: !once, above: mirror && !once }
		const changes = [...this.#elements].map(
			element => [element, offscreenState(element, reset)] as const,
		)
		for (const [element, state] of changes) {
			if (state) {
				setRevealState(element, state)
			}
			if (state === ServiceRevealState.visible) {
				this.release(element)
			}
		}
	}

	private release(element: Element): void {
		if (config.services.reveal.once) {
			this.#enter?.unobserve(element)
			this.#leave?.unobserve(element)
		}
	}

	private readonly settle = (event: AnimationEvent): void => {
		if (isRevealEnd(event)) {
			setRevealState(event.currentTarget as Element, ServiceRevealState.visible)
		}
	}
}

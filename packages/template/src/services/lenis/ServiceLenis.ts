import { type AppConfig, config } from '@config'
import { BaseService } from '@libs/service'
import Lenis, { type ScrollToOptions as LenisScrollToOptions } from 'lenis'
import { ServiceLenisState } from './lib/lenisState'
import { nativeScrollTo, type ServiceLenisTarget } from './lib/nativeScroll'
import { ServiceLenisAttribute } from './lib/lenisAttribute'
import './lenis.scss'

export type ServiceLenisOptions = AppConfig['services']['lenis']['options']

export class ServiceLenis extends BaseService {
	public static override readonly serviceName = 'lenis'
	readonly #instances = new Map<HTMLElement, Lenis>()
	readonly #options = new WeakMap<HTMLElement, ServiceLenisOptions>()
	readonly #stops = new Map<HTMLElement, number>()
	#observer: MutationObserver | null = null
	#frame = 0

	public get enabled(): boolean {
		return config.services.lenis.enabled
	}

	public get root(): HTMLElement {
		return document.documentElement
	}

	protected override onInit(): void {
		if (!this.enabled || typeof document === 'undefined') {
			return
		}
		this.#observer = new MutationObserver(this.sync)
		this.#observer.observe(this.root, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: [ServiceLenisAttribute.root],
		})
		this.sync()
		this.#frame = requestAnimationFrame(this.tick)
	}

	public get(element: HTMLElement = this.root): Lenis | undefined {
		return this.#instances.get(element)
	}

	public attach(element: HTMLElement, options?: ServiceLenisOptions): void {
		if (options) {
			this.#options.set(element, options)
		}
		element.setAttribute(ServiceLenisAttribute.root, '')
		this.sync()
	}

	public detach(element: HTMLElement): void {
		element.removeAttribute(ServiceLenisAttribute.root)
		this.sync()
	}

	public stop(element: HTMLElement = this.root): () => void {
		this.#stops.set(element, (this.#stops.get(element) ?? 0) + 1)
		this.apply(element)
		let released = false
		return () => {
			if (!released) {
				released = true
				this.start(element)
			}
		}
	}

	public start(element: HTMLElement = this.root): void {
		const count = (this.#stops.get(element) ?? 0) - 1
		if (count > 0) {
			this.#stops.set(element, count)
		} else {
			this.#stops.delete(element)
		}
		this.apply(element)
	}

	public isStopped(element: HTMLElement = this.root): boolean {
		return this.#stops.has(element)
	}

	public scrollTo(
		target: ServiceLenisTarget,
		options: LenisScrollToOptions = {},
		element: HTMLElement = this.root,
	): void {
		const lenis = this.get(element)
		if (lenis) {
			lenis.scrollTo(target, options)
			return
		}
		nativeScrollTo(target, options, element)
	}

	public resize(): void {
		for (const lenis of this.#instances.values()) {
			lenis.resize()
		}
	}

	public destroy(): void {
		this.#observer?.disconnect()
		this.#observer = null
		cancelAnimationFrame(this.#frame)
		for (const element of [...this.#instances.keys()]) {
			this.destroyInstance(element)
		}
		ServiceLenis.resetInstance()
	}

	private readonly sync = (): void => {
		const selector = `[${ServiceLenisAttribute.root}]`
		const elements = new Set(this.root.querySelectorAll<HTMLElement>(selector))
		if (this.root.matches(selector)) {
			elements.add(this.root)
		}
		for (const element of [...this.#instances.keys()]) {
			if (!elements.has(element)) {
				this.destroyInstance(element)
			}
		}
		for (const element of elements) {
			if (!this.#instances.has(element)) {
				this.createInstance(element)
			}
		}
	}

	private readonly tick = (time: number): void => {
		for (const lenis of this.#instances.values()) {
			lenis.raf(time)
		}
		this.#frame = requestAnimationFrame(this.tick)
	}

	private createInstance(element: HTMLElement): void {
		const isRoot = element === this.root
		const wrapper = isRoot ? window : element
		const openSelect = CSS.supports('selector(:open)') ? 'select:open' : null
		const lenis = new Lenis({
			...config.services.lenis.options,
			...this.#options.get(element),
			wrapper,
			content: isRoot ? element : (element.firstElementChild ?? element),
			eventsTarget: wrapper,
			autoRaf: false,
			autoToggle: false,
			allowNestedScroll: true,
			prevent: node =>
				node.hasAttribute(ServiceLenisAttribute.prevent) ||
				(openSelect !== null && node.matches(openSelect)),
		})
		this.#instances.set(element, lenis)
		this.apply(element)
	}

	private destroyInstance(element: HTMLElement): void {
		this.#instances.get(element)?.destroy()
		this.#instances.delete(element)
		this.apply(element)
	}

	private apply(element: HTMLElement): void {
		const stopped = this.isStopped(element)
		const lenis = this.get(element)
		if (lenis) {
			if (stopped) {
				lenis.stop()
			} else {
				lenis.start()
			}
			return
		}
		if (stopped) {
			element.setAttribute(ServiceLenisAttribute.state, ServiceLenisState.stopped)
		} else {
			element.removeAttribute(ServiceLenisAttribute.state)
		}
	}
}

import { config } from '@config'
import { createBlock } from '@libs/bem'
import { BaseService } from '@libs/service'
import { name } from 'block:name'
import 'overlayscrollbars/overlayscrollbars.css'
import { ScrollbarFrame } from './lib/scrollbarFrame'
import {
	isInScope,
	isScrollContainer,
	type ScrollbarScope,
	scrollbarCandidates,
	supportsScrollTimeline,
} from './lib/scrollbarScan'
import { serviceScrollbarNative } from './lib/scrollbarState'
import { ScrollbarWatcher } from './lib/scrollbarWatcher'
import { ServiceScrollbarAttribute } from './lib/scrollbarAttribute'
import './service-scrollbar.global.scss'

const resizeRescanDelay = 200

export class ServiceScrollbar extends BaseService {
	public static override readonly serviceName = 'scrollbar'
	readonly #frames = new Map<HTMLElement, ScrollbarFrame>()
	readonly #block = createBlock(name)
	readonly #scope: ScrollbarScope = {
		mode: config.services.scrollbar.mode,
		exclude: config.services.scrollbar.exclude,
		own: `[class^="${this.#block.block}"], [class*=" ${this.#block.block}"]`,
	}
	#timeline = false
	#media: MediaQueryList | null = null
	#watcher: ScrollbarWatcher | null = null
	#resizeTimer = 0

	public get enabled(): boolean {
		return config.services.scrollbar.enabled
	}

	public get active(): boolean {
		return this.#watcher !== null
	}

	public get root(): HTMLElement {
		return document.documentElement
	}

	protected override onInit(): void {
		if (!this.enabled || typeof document === 'undefined') {
			return
		}
		this.#media = window.matchMedia('(forced-colors: active)')
		this.#media.addEventListener('change', this.toggle)
		this.toggle()
	}

	public attach(element: HTMLElement, theme = ''): void {
		element.setAttribute(ServiceScrollbarAttribute.root, theme)
		this.refresh(element)
	}

	public detach(element: HTMLElement): void {
		element.setAttribute(ServiceScrollbarAttribute.root, serviceScrollbarNative)
		this.refresh(element)
	}

	public refresh(element: Element = this.root): void {
		if (!this.active) {
			return
		}
		this.#watcher?.queue(element)
	}

	public update(): void {
		for (const frame of this.#frames.values()) {
			frame.update()
		}
	}

	public isCustom(element: HTMLElement): boolean {
		return this.#frames.has(element)
	}

	public destroy(): void {
		this.#media?.removeEventListener('change', this.toggle)
		this.#media = null
		this.stop()
		ServiceScrollbar.resetInstance()
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
		this.#timeline = supportsScrollTimeline()
		this.#watcher = new ScrollbarWatcher(this.root, {
			own: this.#scope.own,
			flush: this.flush,
		})
		window.addEventListener('resize', this.onResize)
		this.refresh()
	}

	private stop(): void {
		this.#watcher?.disconnect()
		this.#watcher = null
		window.removeEventListener('resize', this.onResize)
		window.clearTimeout(this.#resizeTimer)
		for (const element of [...this.#frames.keys()]) {
			this.release(element)
		}
	}

	private readonly onResize = (): void => {
		this.update()
		window.clearTimeout(this.#resizeTimer)
		this.#resizeTimer = window.setTimeout(() => this.refresh(), resizeRescanDelay)
	}

	private readonly flush = (roots: Element[]): void => {
		for (const element of [...this.#frames.keys()]) {
			if (!element.isConnected) {
				this.release(element)
			}
		}
		for (const element of roots.flatMap(root =>
			scrollbarCandidates(root, this.#scope),
		)) {
			const claimed = this.#frames.has(element)
			if (
				isInScope(element, this.#scope) &&
				(claimed || isScrollContainer(element))
			) {
				this.claim(element)
			} else {
				this.release(element)
			}
		}
	}

	private claim(element: HTMLElement): void {
		if (this.#frames.has(element)) {
			return
		}
		const frame = this.createFrame(element)
		if (!frame.active) {
			return
		}
		this.#frames.set(element, frame)
	}

	private createFrame(element: HTMLElement): ScrollbarFrame {
		try {
			return new ScrollbarFrame(element, {
				block: this.#block,
				idle: config.services.scrollbar.idle,
				timeline: this.#timeline,
				options: config.services.scrollbar.options,
			})
		} catch (error) {
			this.stop()
			throw error
		}
	}

	private release(element: HTMLElement): void {
		this.#frames.get(element)?.destroy()
		this.#frames.delete(element)
	}
}

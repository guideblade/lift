import { type Block, bemMismatch } from '@libs/bem'
import { OverlayScrollbars } from 'overlayscrollbars'
import {
	ServiceScrollbarState,
	type ServiceScrollbarOptions,
	type ServiceScrollbarVariable,
} from './scrollbarState'
import { ServiceScrollbarAttribute } from './scrollbarAttribute'

export type ScrollbarFrameOptions = {
	block: Block
	idle: number
	timeline: boolean
	options: ServiceScrollbarOptions
}

export class ScrollbarFrame {
	readonly element: HTMLElement
	readonly root: HTMLElement
	readonly #options: ScrollbarFrameOptions
	readonly #instance: OverlayScrollbars
	#timer = 0

	constructor(element: HTMLElement, options: ScrollbarFrameOptions) {
		this.element = element
		this.#options = options
		const { block } = options
		this.root = document.createElement('div')
		this.root.className = this.isPage
			? `${block.block} ${block.modifier('page')}`
			: block.block
		this.root.setAttribute('aria-hidden', 'true')
		const target = this.isPage ? document.body : element
		target.append(this.root)
		this.#instance = OverlayScrollbars(
			{
				target,
				elements: { viewport: target },
				scrollbars: { slot: this.root },
				cancel: { nativeScrollbarsOverlaid: false, body: null },
			},
			{
				...options.options,
				scrollbars: { ...options.options.scrollbars, theme: null },
			},
			{ updated: this.onUpdated, scroll: this.onScroll },
		)
		this.checkNames()
		if (this.active) {
			this.setState(ServiceScrollbarState.idle)
		} else {
			this.root.remove()
		}
	}

	private checkNames(): void {
		const rail = this.#options.block.element('rail')
		const found = this.root.firstElementChild
		if (found && !found.classList.contains(rail)) {
			this.destroy()
			throw bemMismatch('OverlayScrollbars', found.classList[0] ?? '', rail)
		}
	}

	get isPage(): boolean {
		return this.element === document.documentElement
	}

	get active(): boolean {
		return OverlayScrollbars.valid(this.#instance)
	}

	get instance(): OverlayScrollbars {
		return this.#instance
	}

	update(): void {
		if (this.active) {
			this.#instance.update(true)
		}
	}

	destroy(): void {
		window.clearTimeout(this.#timer)
		if (this.active) {
			this.#instance.destroy()
		}
		this.root.remove()
		this.element.removeAttribute(ServiceScrollbarAttribute.state)
	}

	private readonly onUpdated = (instance: OverlayScrollbars): void => {
		const { overflowAmount } = instance.state()
		this.write('max-x', overflowAmount.x)
		this.write('max-y', overflowAmount.y)
		this.writeOffsets()
	}

	private readonly onScroll = (): void => {
		this.setState(ServiceScrollbarState.scrolling)
		window.clearTimeout(this.#timer)
		this.#timer = window.setTimeout(
			() => this.setState(ServiceScrollbarState.idle),
			this.#options.idle,
		)
		this.writeOffsets()
	}

	private writeOffsets(): void {
		if (this.#options.timeline || this.isPage) {
			return
		}
		this.write('offset-x', this.element.scrollLeft)
		this.write('offset-y', this.element.scrollTop)
	}

	private write(variable: ServiceScrollbarVariable, value: number): void {
		this.root.style.setProperty(
			`--${this.#options.block.block}-${variable}`,
			`${value}px`,
		)
	}

	private setState(state: ServiceScrollbarState): void {
		this.element.setAttribute(ServiceScrollbarAttribute.state, state)
	}
}

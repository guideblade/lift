const HTMLElementBase = (globalThis.HTMLElement ?? class {}) as typeof HTMLElement

export abstract class BaseElement extends HTMLElementBase {
	#controller: AbortController | null = null

	public get isSetUp(): boolean {
		return this.#controller !== null
	}

	protected get signal(): AbortSignal {
		return this.#controller?.signal ?? AbortSignal.abort()
	}

	public connectedCallback(): void {
		if (this.#controller) {
			return
		}
		const controller = new AbortController()
		this.#controller = controller
		try {
			this.mount(controller.signal)
		} catch (error) {
			this.#controller = null
			controller.abort()
			throw error
		}
	}

	public disconnectedCallback(): void {
		queueMicrotask(() => {
			const controller = this.#controller
			if (this.isConnected || !controller) {
				return
			}
			this.#controller = null
			try {
				this.unmount()
			} finally {
				controller.abort()
			}
		})
	}

	protected mount(signal: AbortSignal): void {
		this.setup(signal)
	}

	protected unmount(): void {
		this.teardown()
	}

	protected setup(_signal: AbortSignal): void {}

	protected teardown(): void {}

	protected listen<E extends Event = Event>(
		target: EventTarget,
		type: string,
		listener: (event: E) => void,
		options?: AddEventListenerOptions,
	): void {
		target.addEventListener(type, listener as EventListener, {
			...options,
			signal: this.signal,
		})
	}

	protected onAbort(callback: () => void): void {
		const signal = this.signal
		if (signal.aborted) {
			callback()
			return
		}
		signal.addEventListener('abort', callback, { once: true })
	}
}

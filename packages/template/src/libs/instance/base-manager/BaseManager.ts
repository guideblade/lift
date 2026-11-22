import type { BaseInstance } from '../base-instance/BaseInstance'

const managers = new Map<object, BaseManager<BaseInstance>>()

export abstract class BaseManager<TInstance extends BaseInstance = BaseInstance> {
	public static readonly instanceName: string = ''
	protected readonly instances = new Set<TInstance>()
	#initialized = false
	#controller: AbortController | null = null
	#stopScheduled = false

	public static getInstance<T extends BaseManager<BaseInstance>>(this: new () => T): T {
		const existing = managers.get(this)
		if (existing) {
			return existing as T
		}
		const manager = new this()
		managers.set(this, manager)
		if (typeof window !== 'undefined' && manager.name) {
			window.managers ??= {}
			window.managers[manager.name] = manager
		}
		manager.init()
		return manager
	}

	public get name(): string {
		return (this.constructor as typeof BaseManager).instanceName
	}

	public get isRunning(): boolean {
		return this.#controller !== null
	}

	public get size(): number {
		return this.instances.size
	}

	protected get signal(): AbortSignal {
		return this.#controller?.signal ?? AbortSignal.abort()
	}

	public init(): void {
		if (this.#initialized) {
			return
		}
		this.#initialized = true
		this.onInit()
	}

	public start(): void {
		if (this.#controller) {
			return
		}
		const controller = new AbortController()
		this.#controller = controller
		try {
			this.onStart(controller.signal)
		} catch (error) {
			this.#controller = null
			controller.abort()
			throw error
		}
	}

	public stop(): void {
		const controller = this.#controller
		if (!controller) {
			return
		}
		this.#controller = null
		try {
			this.onStop()
		} finally {
			controller.abort()
		}
	}

	public register(instance: TInstance): void {
		if (this.instances.has(instance)) {
			return
		}
		this.instances.add(instance)
		this.onRegister(instance)
		this.start()
	}

	public unregister(instance: TInstance): void {
		if (!this.instances.delete(instance)) {
			return
		}
		this.onUnregister(instance)
		if (this.instances.size === 0) {
			this.scheduleStop()
		}
	}

	public has(instance: TInstance): boolean {
		return this.instances.has(instance)
	}

	public getAll(): TInstance[] {
		return Array.from(this.instances)
	}

	protected onInit(): void {}

	protected onStart(_signal: AbortSignal): void {}

	protected onStop(): void {}

	protected onRegister(_instance: TInstance): void {}

	protected onUnregister(_instance: TInstance): void {}

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

	private scheduleStop(): void {
		if (this.#stopScheduled) {
			return
		}
		this.#stopScheduled = true
		queueMicrotask(() => {
			this.#stopScheduled = false
			if (this.instances.size === 0) {
				this.stop()
			}
		})
	}
}

import {
	componentBlock,
	DataAttribute,
} from '../../attributes/data-attribute/dataAttribute'
import type { Block } from '../../bem/create-block/createBlock'
import { BaseElement } from '../base-element/BaseElement'
import type { BaseManager } from '../base-manager/BaseManager'
import { InstanceState } from '../instance-state/instanceState'

export abstract class BaseInstance extends BaseElement {
	public static readonly requiresJs: boolean = true
	public static readonly instanceName: string = ''
	#state: InstanceState = InstanceState.unmounted
	#component: Block | null = null

	protected abstract get manager(): BaseManager<BaseInstance>

	protected get component(): Block {
		this.#component ??= componentBlock(this)
		return this.#component
	}

	public get name(): string {
		return (this.constructor as typeof BaseInstance).instanceName
	}

	public get requiresJs(): boolean {
		return (this.constructor as typeof BaseInstance).requiresJs
	}

	public get lifecycleState(): InstanceState {
		return this.#state
	}

	public get isMounted(): boolean {
		return this.#state === InstanceState.mounted
	}

	protected override mount(signal: AbortSignal): void {
		this.setAttribute(DataAttribute.instanceRequiresJs, String(this.requiresJs))
		if (this.name) {
			this.setAttribute(DataAttribute.instanceName, this.name)
		}
		this.setLifecycleState(InstanceState.mounting)
		try {
			this.manager.register(this)
			super.mount(signal)
			this.setLifecycleState(InstanceState.mounted)
		} catch (error) {
			console.error(`[${this.constructor.name}] Setup failed:`, error, this)
			this.manager.unregister(this)
			this.setLifecycleState(InstanceState.failed)
			throw error
		}
	}

	protected override unmount(): void {
		this.setLifecycleState(InstanceState.unmounting)
		try {
			super.unmount()
		} catch (error) {
			console.error(`[${this.constructor.name}] Teardown failed:`, error, this)
		} finally {
			this.manager.unregister(this)
			this.setLifecycleState(InstanceState.unmounted)
		}
	}

	protected dispatch<T = unknown>(eventName: string, detail?: T): boolean {
		const prefix = `${this.name}:`
		if (eventName.startsWith(prefix) || eventName === this.name) {
			throw new Error(
				`[${this.constructor.name}] Invalid event name "${eventName}". Do not include the "${prefix}" prefix; it is auto-prepended.`,
			)
		}

		return this.dispatchEvent(
			new CustomEvent(`${prefix}${eventName}`, {
				bubbles: true,
				cancelable: true,
				detail,
			}),
		)
	}

	private setLifecycleState(state: InstanceState): void {
		this.#state = state
		this.setAttribute(DataAttribute.instanceState, state)
	}
}

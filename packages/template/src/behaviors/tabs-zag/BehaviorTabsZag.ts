import * as tabs from '@zag-js/tabs'
import { normalizeProps, spreadProps, VanillaMachine } from '@zag-js/vanilla'
import { BaseInstance } from '@libs/instance'
import { findInitialValue, queryTabsElements, type TabsElements } from './lib/tabsDom'

interface TabsMachine {
	readonly service: tabs.Service
	start(): void
	stop(): void
	subscribe(listener: () => void): () => void
}

export abstract class BehaviorTabsZag extends BaseInstance {
	public static override readonly requiresJs: boolean = false
	#machine: TabsMachine | null = null
	#elements: TabsElements | null = null
	#cleanups: (() => void)[] = []

	private get api(): tabs.Api | null {
		return this.#machine ? tabs.connect(this.#machine.service, normalizeProps) : null
	}

	public get value(): string {
		return this.api?.value ?? ''
	}

	public setValue(value: string): void {
		this.api?.setValue(value)
	}

	public selectNext(): void {
		this.api?.selectNext()
	}

	public selectPrev(): void {
		this.api?.selectPrev()
	}

	protected override setup(): void {
		const elements = queryTabsElements(this, this.component)
		if (!elements) {
			return
		}
		const id = this.id || `${this.component.block}-${crypto.randomUUID()}`
		const indexByValue = new Map(
			elements.triggers.map((trigger, index) => [trigger.value, index]),
		)
		const orientation =
			this.data('orientation') === 'vertical' ? 'vertical' : 'horizontal'
		const activationMode =
			this.data('activation') === 'manual' ? 'manual' : 'automatic'
		this.#elements = elements

		const machine = new VanillaMachine(tabs.machine, {
			id,
			ids: {
				root: id,
				list: `${id}-list`,
				indicator: `${id}-indicator`,
				trigger: value => `${id}-trigger-${indexByValue.get(value) ?? value}`,
				content: value => `${id}-panel-${indexByValue.get(value) ?? value}`,
			},
			orientation,
			activationMode,
			loopFocus: true,
			defaultValue: findInitialValue(elements.triggers, this.data('value')),
			translations: { listLabel: this.data('label') || undefined },
			onValueChange: ({ value }) => this.dispatch('change', { value }),
		})
		this.#machine = machine
		this.render()
		machine.start()
		this.onAbort(machine.subscribe(() => this.render()))
		this.render()
	}

	protected override teardown(): void {
		this.#machine?.stop()
		for (const cleanup of this.#cleanups) {
			cleanup()
		}
		this.#cleanups = []
		this.#machine = null
		this.#elements = null
	}

	private data(key: string): string {
		return this.getAttribute(this.component.data(key)) ?? ''
	}

	private render(): void {
		const api = this.api
		const elements = this.#elements
		if (!api || !elements) {
			return
		}
		this.#cleanups = [
			spreadProps(this, api.getRootProps()),
			spreadProps(elements.list, api.getListProps()),
			...(elements.indicator
				? [spreadProps(elements.indicator, api.getIndicatorProps())]
				: []),
			...elements.triggers.map(({ element, value, disabled }) =>
				spreadProps(element, api.getTriggerProps({ value, disabled })),
			),
			...elements.panels.map(({ element, value }) =>
				spreadProps(element, api.getContentProps({ value })),
			),
		]
	}
}

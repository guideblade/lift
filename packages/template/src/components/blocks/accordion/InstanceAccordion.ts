import { BaseInstance, defineElement } from '@libs/instance'
import { ManagerAccordion } from './ManagerAccordion'

export class InstanceAccordion extends BaseInstance {
	public static override readonly requiresJs: boolean = false
	protected get manager(): ManagerAccordion {
		return ManagerAccordion.getInstance()
	}

	public get details(): HTMLDetailsElement | null {
		return this.querySelector('details')
	}

	public open(): void {
		if (this.details) {
			this.details.open = true
		}
	}

	public close(): void {
		if (this.details) {
			this.details.open = false
		}
	}
}

defineElement(InstanceAccordion)

import { BaseInstance, defineElement } from '@libs/instance'
import { ManagerComponent } from './ManagerComponent'

export class InstanceComponent extends BaseInstance {
	public static override readonly requiresJs: boolean = true

	protected get manager(): ManagerComponent {
		return ManagerComponent.getInstance()
	}

	protected override setup(_signal: AbortSignal): void {}

	protected override teardown(): void {}
}

defineElement(InstanceComponent)

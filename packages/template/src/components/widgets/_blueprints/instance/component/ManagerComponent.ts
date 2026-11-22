import { BaseManager } from '@libs/instance'
import type { InstanceComponent } from './InstanceComponent'

export class ManagerComponent extends BaseManager<InstanceComponent> {
	protected override onInit(): void {}

	protected override onStart(_signal: AbortSignal): void {}

	protected override onStop(): void {}
}

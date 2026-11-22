import { BehaviorTabsZag } from '@behaviors/tabs-zag'
import { defineElement } from '@libs/instance'
import { ManagerNavSimpleTabs } from './ManagerNavSimpleTabs'

export class InstanceNavSimpleTabs extends BehaviorTabsZag {
	protected get manager(): ManagerNavSimpleTabs {
		return ManagerNavSimpleTabs.getInstance()
	}
}

defineElement(InstanceNavSimpleTabs)

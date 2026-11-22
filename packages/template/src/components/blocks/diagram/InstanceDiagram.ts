import { BehaviorDiagramPele } from '@behaviors/diagram-pele'
import { defineElement } from '@libs/instance'
import { ManagerDiagram } from './ManagerDiagram'

export class InstanceDiagram extends BehaviorDiagramPele {
	protected get manager(): ManagerDiagram {
		return ManagerDiagram.getInstance()
	}
}

defineElement(InstanceDiagram)

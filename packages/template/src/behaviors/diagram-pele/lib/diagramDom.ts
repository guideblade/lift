import type { MountOptions } from 'pele'
import { type Block, classSelector } from '@libs/bem'

export type DiagramZoom = 'auto' | 'always' | 'off'

export function queryDiagramStage(
	root: HTMLElement,
	component: Block,
): HTMLElement | null {
	const stages = root.querySelectorAll<HTMLElement>(`[${component.data('stage')}]`)
	return (
		Array.from(stages).find(
			stage => stage.closest(classSelector(component.block)) === root,
		) ?? null
	)
}

export function zoomOption(value: string): MountOptions['zoom'] {
	if (value === 'off') {
		return false
	}
	return value === 'always' ? { always: true } : 'auto'
}

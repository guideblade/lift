import { type Block, classSelector } from '@libs/bem'

export interface TabsTrigger {
	value: string
	element: HTMLButtonElement
	disabled: boolean
}

export interface TabsPanel {
	value: string
	element: HTMLElement
}

export interface TabsElements {
	list: HTMLElement
	indicator: HTMLElement | null
	triggers: TabsTrigger[]
	panels: TabsPanel[]
}

function queryOwned<T extends HTMLElement>(
	root: HTMLElement,
	component: Block,
	key: string,
): T[] {
	return Array.from(root.querySelectorAll<T>(`[${component.data(key)}]`)).filter(
		element => element.closest(classSelector(component.block)) === root,
	)
}

export function queryTabsElements(
	root: HTMLElement,
	component: Block,
): TabsElements | null {
	const [list] = queryOwned(root, component, 'list')
	const [indicator = null] = queryOwned(root, component, 'indicator')
	const triggerKey = component.data('trigger')
	const panelKey = component.data('panel')
	const triggers = queryOwned<HTMLButtonElement>(root, component, 'trigger').map(
		element => ({
			value: element.getAttribute(triggerKey) ?? '',
			element,
			disabled: element.disabled,
		}),
	)
	const panels = queryOwned(root, component, 'panel').map(element => ({
		value: element.getAttribute(panelKey) ?? '',
		element,
	}))
	if (!list || !triggers.length) {
		return null
	}
	return { list, indicator, triggers, panels }
}

export function findInitialValue(
	triggers: TabsTrigger[],
	preferred: string,
): string | null {
	const enabled = triggers.filter(trigger => !trigger.disabled)
	return (
		enabled.find(trigger => trigger.value === preferred)?.value ??
		enabled[0]?.value ??
		null
	)
}

import type { HeaderNavItem, HeaderNavLink, HeaderNavMenuItem } from '../model/header-nav'

export function panelsOf(items: HeaderNavItem[]): string[] {
	return items.flatMap(item => ('panel' in item ? [item.panel] : []))
}

export function levelsOf(items: HeaderNavMenuItem[]): string[] {
	return items.flatMap(item => {
		if ('level' in item) {
			return [item.level]
		}
		return 'items' in item ? levelsOf(item.items) : []
	})
}

export function linksOf(items: HeaderNavItem[]): HeaderNavLink[] {
	return items.filter((item): item is HeaderNavLink => 'href' in item)
}

export function showOnly(
	root: HTMLElement | null,
	attribute: string,
	value: string | null,
) {
	for (const element of root?.querySelectorAll<HTMLElement>(`[${attribute}]`) ?? []) {
		element.hidden = element.getAttribute(attribute) !== value
	}
}

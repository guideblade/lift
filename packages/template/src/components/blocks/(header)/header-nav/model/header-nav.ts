import type { SampleSlots } from '@libs/astro'

export type HeaderNavLink = {
	label: string
	href: string
}

export type HeaderNavItem = HeaderNavLink | { label: string; panel: string }

export type HeaderNavMenuItem =
	| HeaderNavLink
	| { label: string; items: HeaderNavMenuItem[] }
	| { label: string; level: string }

export type HeaderNavContent = {
	start?: HeaderNavItem[]
	end?: HeaderNavItem[]
	menuItems?: HeaderNavMenuItem[]
	sampleSlots?: SampleSlots<'logo' | `panel-${string}` | `level-${string}`>
}

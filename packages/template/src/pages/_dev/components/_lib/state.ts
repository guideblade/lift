import { viewportQuery } from '@config'

export type DocsState = {
	panel: 'bottom' | 'right'
	bottom: number | null
	right: number | null
	width: string
	theme: string
	scheme: string
	tab: string
	shareHost: string
}

export const stateKey = 'lift-docs'
export const desktopQuery = viewportQuery('large')

export function load(): Partial<DocsState> {
	try {
		return JSON.parse(localStorage.getItem(stateKey) ?? '{}') ?? {}
	} catch {
		return {}
	}
}

export function save(patch: Partial<DocsState>) {
	try {
		localStorage.setItem(stateKey, JSON.stringify({ ...load(), ...patch }))
	} catch {}
}

export function setSize(app: HTMLElement, name: string, px: number | null | undefined) {
	if (px) {
		app.style.setProperty(name, `${px}px`)
	} else {
		app.style.removeProperty(name)
	}
}

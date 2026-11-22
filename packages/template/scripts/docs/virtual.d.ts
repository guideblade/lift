declare module 'virtual:lift-docs' {
	import type { DocEntry } from '#docs'

	export const components: DocEntry[]
	export function utilities(values: Record<string, unknown>): Promise<string>
}

import type { SampleSlots } from '@libs/astro'

export type NavSimpleTabsContent = {
	items: { value: string; label: string; disabled?: boolean }[]
	sampleSlots?: SampleSlots<string>
}

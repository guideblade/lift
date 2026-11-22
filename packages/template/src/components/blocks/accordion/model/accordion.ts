import type { SampleSlots } from '@libs/astro'

export type AccordionContent = {
	summary: string
	sampleSlots?: SampleSlots<'default'>
}

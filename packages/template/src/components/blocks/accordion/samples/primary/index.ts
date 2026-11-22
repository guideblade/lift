import type { AccordionContent } from '../../model/accordion'
import Default from './default.slot.astro'

export const sample = {
	summary: 'What is Lift?',
	sampleSlots: { default: Default },
} satisfies AccordionContent

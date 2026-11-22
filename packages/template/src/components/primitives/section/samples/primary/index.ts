import type { SectionContent } from '../../model/section'
import Default from './default.slot.astro'

export const sample = {
	sampleSlots: { default: Default },
} satisfies SectionContent

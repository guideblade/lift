import type { LegendContent } from '../../model/legend'
import Default from './default.slot.astro'

export const sample = {
	sampleSlots: { default: Default },
} satisfies LegendContent

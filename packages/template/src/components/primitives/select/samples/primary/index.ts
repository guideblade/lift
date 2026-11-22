import type { SelectContent } from '../../model/select'
import Default from './default.slot.astro'

export const sample = {
	sampleSlots: { default: Default },
} satisfies SelectContent

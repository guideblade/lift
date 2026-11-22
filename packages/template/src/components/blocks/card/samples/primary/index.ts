import type { CardContent } from '../../model/card'
import Default from './default.slot.astro'

export const sample = {
	sampleSlots: { default: Default },
} satisfies CardContent

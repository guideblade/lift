import type { LabelContent } from '../../model/label'
import Default from './default.slot.astro'

export const sample = {
	sampleSlots: { default: Default },
} satisfies LabelContent

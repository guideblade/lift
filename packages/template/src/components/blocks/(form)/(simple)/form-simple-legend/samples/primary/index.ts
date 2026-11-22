import type { FormSimpleLegendContent } from '../../model/form-simple-legend'
import Legend from './legend.slot.astro'

export const sample = {
	sampleSlots: { legend: Legend },
} satisfies FormSimpleLegendContent

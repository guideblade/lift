import type { LayoutFormContent } from '../../model/layout-form'
import Default from './default.slot.astro'

export const sample = {
	sampleSlots: { default: Default },
} satisfies LayoutFormContent

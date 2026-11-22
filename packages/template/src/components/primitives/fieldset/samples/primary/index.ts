import type { FieldsetContent } from '../../model/fieldset'
import Default from './default.slot.astro'

export const sample = {
	sampleSlots: { default: Default },
} satisfies FieldsetContent

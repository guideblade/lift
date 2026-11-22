import type { FormSimpleFormContent } from '../../model/form-simple-form'
import Default from './default.slot.astro'

export const sample = {
	sampleSlots: { default: Default },
} satisfies FormSimpleFormContent

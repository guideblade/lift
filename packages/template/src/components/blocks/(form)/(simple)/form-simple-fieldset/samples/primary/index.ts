import type { FormSimpleFieldsetContent } from '../../model/form-simple-fieldset'
import Fieldset from './fieldset.slot.astro'

export const sample = {
	sampleSlots: { fieldset: Fieldset },
} satisfies FormSimpleFieldsetContent

import type { FormSimpleCheckboxContent } from '../../model/form-simple-checkbox'
import Checkbox from './checkbox.slot.astro'
import Default from './default.slot.astro'

export const sample = {
	sampleSlots: { checkbox: Checkbox, default: Default },
} satisfies FormSimpleCheckboxContent

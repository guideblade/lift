import type { FormSimpleSelectContent } from '../../model/form-simple-select'
import Select from './select.slot.astro'

export const sample = {
	sampleSlots: { select: Select },
} satisfies FormSimpleSelectContent

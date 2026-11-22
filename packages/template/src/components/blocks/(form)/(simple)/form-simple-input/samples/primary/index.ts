import type { FormSimpleInputContent } from '../../model/form-simple-input'
import Input from './input.slot.astro'

export const sample = {
	sampleSlots: { input: Input },
} satisfies FormSimpleInputContent

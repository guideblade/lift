import type { FormSimpleRadioContent } from '../../model/form-simple-radio'
import Radio from './radio.slot.astro'
import Default from './default.slot.astro'

export const sample = {
	sampleSlots: { radio: Radio, default: Default },
} satisfies FormSimpleRadioContent

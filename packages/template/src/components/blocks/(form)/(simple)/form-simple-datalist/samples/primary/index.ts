import type { FormSimpleDatalistContent } from '../../model/form-simple-datalist'
import Datalist from './datalist.slot.astro'

export const sample = {
	sampleSlots: { datalist: Datalist },
} satisfies FormSimpleDatalistContent

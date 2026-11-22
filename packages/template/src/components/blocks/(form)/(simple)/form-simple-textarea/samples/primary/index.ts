import type { FormSimpleTextareaContent } from '../../model/form-simple-textarea'
import Textarea from './textarea.slot.astro'

export const sample = {
	sampleSlots: { textarea: Textarea },
} satisfies FormSimpleTextareaContent

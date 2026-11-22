import type { FormSimpleButtonContent } from '../../model/form-simple-button'
import Button from './button.slot.astro'

export const sample = {
	sampleSlots: { button: Button },
} satisfies FormSimpleButtonContent

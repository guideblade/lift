import type { UnorderedListContent } from '../../model/unordered-list'
import Default from './default.slot.astro'

export const sample = {
	sampleSlots: { default: Default },
} satisfies UnorderedListContent

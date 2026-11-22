import type { HeroContent } from '../../model/hero'
import Default from './default.slot.astro'

export const sample = {
	title: 'Hello',
	description: 'This is Lift',
	sampleSlots: { default: Default },
} satisfies HeroContent

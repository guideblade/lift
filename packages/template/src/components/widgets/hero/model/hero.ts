import type { SampleSlots } from '@libs/astro'

export type HeroContent = {
	title: string
	description?: string
	sampleSlots?: SampleSlots<'default'>
}

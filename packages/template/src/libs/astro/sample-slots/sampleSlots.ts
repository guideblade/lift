import type { AstroComponentFactory } from 'astro/runtime/server/index.js'

export type SampleSlots<TName extends string> = Partial<
	Record<TName, AstroComponentFactory>
>

import type { NavSimpleTabsContent } from '../../model/nav-simple-tabs'
import Details from './details.slot.astro'
import Overview from './overview.slot.astro'

export const sample = {
	items: [
		{ value: 'overview', label: 'Overview' },
		{ value: 'details', label: 'Details' },
		{ value: 'archive', label: 'Archive', disabled: true },
	],
	sampleSlots: { overview: Overview, details: Details },
} satisfies NavSimpleTabsContent

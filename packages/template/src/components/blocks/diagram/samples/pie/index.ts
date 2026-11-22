import type { DiagramContent } from '../../model/diagram'

export const sample = {
	source: [
		'pie title Bundle share',
		'  "Astro" : 42',
		'  "Vue" : 23',
		'  "Other" : 35',
	].join('\n'),
	zoom: 'off',
} satisfies DiagramContent

import type { DiagramContent } from '../../model/diagram'

export const sample = {
	source: [
		'flowchart LR',
		'  accTitle: Lift build pipeline',
		'  src[Source] --> astro{Astro build}',
		'  astro -- pages --> html([HTML])',
		'  astro -- styles --> css([CSS])',
		'  html --> validate[Validate]',
		'  css --> validate',
		'  validate --> audit[Lighthouse]',
	].join('\n'),
} satisfies DiagramContent

import type { DiagramContent } from '../../model/diagram'

export const sample = {
	source: [
		'sequenceDiagram',
		'  accTitle: Loading a page',
		'  participant Browser',
		'  participant Page',
		'  Browser->>Page: Request content',
		'  Page-->>Browser: Return HTML',
	].join('\n'),
} satisfies DiagramContent

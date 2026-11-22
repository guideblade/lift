import { PeleError, render } from 'pele'

let count = 0

export type RenderedDiagram = { svg: string } | { error: string }

export function renderDiagram(source: string): RenderedDiagram {
	count += 1
	try {
		return render(source, { idPrefix: `diagram-${count}-` })
	} catch (error) {
		if (import.meta.env.PROD || !(error instanceof PeleError)) {
			throw error
		}
		const position = error.line ? ` at ${error.line}:${error.column}` : ''
		console.warn(`[Diagram] ${error.message}${position}\n${error.snippet}`)
		return { error: error.message }
	}
}

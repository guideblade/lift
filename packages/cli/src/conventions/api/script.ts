import { parseSync, type Program, type Span } from 'oxc-parser'

type Node = Span & { type: string }

const isNode = (value: unknown): value is Node =>
	typeof value === 'object' && value !== null && 'type' in value && 'start' in value

export const squash = (code: string) => code.replace(/\s+/g, '').replaceAll('"', "'")

export function collect<T extends Node>(from: unknown, type: T['type']): T[] {
	const found: T[] = []
	const visit = (value: unknown) => {
		if (Array.isArray(value)) {
			value.forEach(visit)
			return
		}
		if (!isNode(value)) {
			return
		}
		if (value.type === type) {
			found.push(value as T)
		}
		Object.values(value).forEach(visit)
	}
	visit(from)
	return found
}

export class Script {
	readonly file: string
	readonly source: string
	readonly program: Program
	readonly errors: string[]
	readonly #offset: number
	readonly #document: string

	constructor(file: string, source: string, at?: { offset: number; document: string }) {
		this.file = file
		this.source = source
		this.#offset = at?.offset ?? 0
		this.#document = at?.document ?? source
		const result = parseSync(file, source, { lang: 'ts' })
		this.program = result.program
		this.errors = result.errors.map(error => error.message)
	}

	text(node: Span) {
		return squash(this.source.slice(node.start, node.end))
	}

	line(node?: Span) {
		return this.#document.slice(0, this.#offset + (node?.start ?? 0)).split('\n')
			.length
	}

	find<T extends Node>(type: T['type'], where: (node: T) => boolean = () => true): T[] {
		return collect<T>(this.program, type).filter(where)
	}
}

export function parseExpression(code: string) {
	const script = new Script('expression.ts', `(${code})`)
	const [statement] = script.program.body
	if (statement?.type !== 'ExpressionStatement') {
		return null
	}
	const expression =
		statement.expression.type === 'ParenthesizedExpression'
			? statement.expression.expression
			: statement.expression
	return { script, expression }
}

import { parse } from '@astrojs/compiler/sync'
import type {
	AttributeNode,
	ElementNode,
	Node,
	RootNode,
	TagLikeNode,
} from '@astrojs/compiler/types'
import { Script, squash } from './script.ts'

const ignored = new Set(['frontmatter', 'doctype', 'comment'])
const hoisted = new Set(['style', 'script'])

export const isTag = (node: Node): node is TagLikeNode => 'attributes' in node

const isHoisted = (node: Node): node is ElementNode =>
	node.type === 'element' && hoisted.has(node.name)

const isBlank = (node: Node) => node.type === 'text' && node.value.trim() === ''

export const spreads = (node: TagLikeNode) =>
	node.attributes
		.filter(attribute => attribute.kind === 'spread')
		.map(a => squash(a.name))

export const attribute = (node: TagLikeNode, name: string): AttributeNode | undefined =>
	node.attributes.find(item => item.name === name && item.kind !== 'spread')

export class AstroFile {
	readonly path: string
	readonly source: string
	readonly ast: RootNode
	readonly errors: string[]
	readonly frontmatter: Script | null

	constructor(path: string, source: string) {
		this.path = path
		this.source = source
		const result = parse(source, { position: true })
		this.ast = result.ast
		this.errors = result.diagnostics.filter(d => d.severity === 1).map(d => d.text)
		const node = this.ast.children.find(child => child.type === 'frontmatter')
		this.frontmatter = node && 'value' in node ? this.#script(node.value, node) : null
	}

	get roots() {
		return this.ast.children.filter(
			node => !ignored.has(node.type) && !isBlank(node) && !isHoisted(node),
		)
	}

	get root(): TagLikeNode | null {
		const [only, ...rest] = this.roots
		return only && rest.length === 0 && isTag(only) ? only : null
	}

	elements(name: string) {
		return this.ast.children.filter(
			(node): node is ElementNode => node.type === 'element' && node.name === name,
		)
	}

	content(node: ElementNode) {
		const text = node.children.find(child => child.type === 'text')
		const value = text && 'value' in text ? text.value : ''
		const offset = this.source.indexOf(value, node.position?.start.offset ?? 0)
		return { value, line: this.source.slice(0, offset).split('\n').length }
	}

	script(node: ElementNode) {
		const { value } = this.content(node)
		return this.#script(value, node)
	}

	#script(value: string, node: Node) {
		const offset = this.source.indexOf(value, node.position?.start.offset ?? 0)
		return new Script(this.path, value, { offset, document: this.source })
	}
}

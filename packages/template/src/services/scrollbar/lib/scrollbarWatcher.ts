import { ServiceScrollbarAttribute } from './scrollbarAttribute'

export type ScrollbarWatcherHandlers = {
	own: string
	flush: (roots: Element[]) => void
}

export class ScrollbarWatcher {
	readonly #handlers: ScrollbarWatcherHandlers
	readonly #pending = new Set<Element>()
	readonly #observer: MutationObserver
	#frame = 0

	constructor(root: HTMLElement, handlers: ScrollbarWatcherHandlers) {
		this.#handlers = handlers
		this.#observer = new MutationObserver(this.onMutation)
		this.#observer.observe(root, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: [ServiceScrollbarAttribute.root],
		})
	}

	queue(element: Element): void {
		this.#pending.add(element)
		if (!this.#frame) {
			this.#frame = requestAnimationFrame(this.flush)
		}
	}

	disconnect(): void {
		this.#observer.disconnect()
		cancelAnimationFrame(this.#frame)
		this.#frame = 0
		this.#pending.clear()
	}

	private readonly onMutation = (records: MutationRecord[]): void => {
		for (const record of records) {
			const nodes =
				record.type === 'attributes' ? [record.target] : record.addedNodes
			for (const node of nodes) {
				if (
					node instanceof Element &&
					node.closest(this.#handlers.own) === null
				) {
					this.queue(node)
				}
			}
			if (record.removedNodes.length > 0) {
				this.queue(record.target as Element)
			}
		}
	}

	private readonly flush = (): void => {
		this.#frame = 0
		const roots = [...this.#pending].filter(root => root.isConnected)
		this.#pending.clear()
		this.#handlers.flush(roots)
	}
}

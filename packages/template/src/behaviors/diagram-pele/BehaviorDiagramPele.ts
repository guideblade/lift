import type { MountOptions, Mounted } from 'pele'
import { BaseInstance } from '@libs/instance'
import { queryDiagramStage, zoomOption } from './lib/diagramDom'

export abstract class BehaviorDiagramPele extends BaseInstance {
	public static override readonly requiresJs: boolean = false
	#diagram: Mounted | null = null
	#error: unknown = undefined

	public get source(): string {
		return this.data('source')
	}

	public get error(): unknown {
		return this.#error
	}

	public async update(source: string): Promise<void> {
		this.setAttribute(this.component.data('source'), source)
		const diagram = this.#diagram
		if (!diagram) {
			return
		}
		const { detectType, load } = await import('pele/lazy')
		await load(detectType(source))
		if (this.#diagram === diagram) {
			diagram.update(source)
		}
	}

	public refresh(): void {
		this.#diagram?.refresh()
	}

	protected options(): MountOptions {
		return {}
	}

	protected override setup(signal: AbortSignal): void {
		const stage = queryDiagramStage(this, this.component)
		if (stage) {
			void this.start(stage, signal)
		}
	}

	protected override teardown(): void {
		this.#diagram?.destroy()
		this.#diagram = null
	}

	private async start(stage: HTMLElement, signal: AbortSignal): Promise<void> {
		const { mountAsync } = await import('pele/lazy')
		if (signal.aborted) {
			return
		}
		const diagram = await mountAsync(stage, this.data('source'), {
			zoom: zoomOption(this.data('zoom')),
			onRender: ({ type, width, height }) => {
				this.#error = undefined
				this.dispatch('render', { type, width, height })
			},
			onError: error => {
				this.#error = error
				this.dispatch('error', { error })
			},
			...this.options(),
		})
		if (signal.aborted) {
			diagram.destroy()
			return
		}
		this.#diagram = diagram
	}

	private data(key: string): string {
		return this.getAttribute(this.component.data(key)) ?? ''
	}
}

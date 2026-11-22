import { config } from '@config'
import { BaseService } from '@libs/service'
import {
	animate,
	createAnimatable,
	createDraggable,
	createLayout,
	createScope,
	createTimeline,
	createTimer,
	easings,
	engine,
	onScroll,
	splitText,
	stagger,
	svg,
	text,
	utils,
	waapi,
} from 'animejs'
import { ServiceAnimeState } from './lib/animeState'
import { ServiceAnimeAttribute } from './lib/animeAttribute'

interface Completable {
	completed: boolean
	complete(): unknown
}

export class ServiceAnime extends BaseService {
	public static override readonly serviceName = 'anime'
	public readonly engine = engine
	public readonly utils = utils
	public readonly easings = easings
	public readonly svg = svg
	public readonly text = text
	public readonly stagger = stagger
	public readonly createTimer = createTimer
	public readonly createAnimatable = createAnimatable
	public readonly createDraggable = createDraggable
	public readonly createLayout = createLayout
	public readonly createScope = createScope
	public readonly onScroll = onScroll
	public readonly splitText = splitText
	#media: MediaQueryList | null = null

	public get enabled(): boolean {
		return config.services.anime.enabled
	}

	public get state(): ServiceAnimeState {
		return !this.enabled || this.#media?.matches
			? ServiceAnimeState.reduced
			: ServiceAnimeState.full
	}

	public get reduced(): boolean {
		return this.state === ServiceAnimeState.reduced
	}

	public get root(): HTMLElement {
		return document.documentElement
	}

	protected override onInit(): void {
		Object.assign(engine.defaults, config.services.anime.defaults)
		if (typeof document === 'undefined') {
			return
		}
		this.#media = window.matchMedia(config.services.anime.reducedMotion)
		this.#media.addEventListener('change', this.apply)
		this.apply()
	}

	public readonly animate: typeof animate = (targets, parameters) =>
		this.settle(animate(targets, parameters))

	public readonly createTimeline: typeof createTimeline = parameters =>
		this.settleAfterBuild(createTimeline(parameters))

	public readonly waapi: typeof waapi = {
		...waapi,
		animate: (targets, parameters) => this.settle(waapi.animate(targets, parameters)),
	}

	public destroy(): void {
		this.#media?.removeEventListener('change', this.apply)
		this.#media = null
		this.root.removeAttribute(ServiceAnimeAttribute.state)
		ServiceAnime.resetInstance()
	}

	private readonly apply = (): void => {
		this.root.setAttribute(ServiceAnimeAttribute.state, this.state)
	}

	private settle<T extends Completable>(tickable: T): T {
		if (this.reduced) {
			tickable.complete()
		}
		return tickable
	}

	private settleAfterBuild<T extends Completable>(tickable: T): T {
		if (this.reduced) {
			queueMicrotask(() => {
				if (!tickable.completed) {
					tickable.complete()
				}
			})
		}
		return tickable
	}
}

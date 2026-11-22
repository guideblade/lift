import { computed, nextTick, ref, shallowRef } from 'vue'

export type Frame = { id: number; src: string; ready: boolean; scripts: boolean }

export function useFrames() {
	const frames = ref<Frame[]>([])
	const elements = new Map<number, HTMLIFrameElement>()
	const view = shallowRef<Window | null>(null)
	let counter = 0

	const busy = computed(() => frames.value.some(frame => !frame.ready))
	const latest = computed(() => frames.value.at(-1)?.src ?? '')
	const hidden = (frame: Frame) =>
		!frame.ready && frames.value.some(other => other.ready)

	const bind = (id: number, element: unknown) =>
		element ? elements.set(id, element as HTMLIFrameElement) : elements.delete(id)

	function show(src: string, scripts = true) {
		frames.value = [
			...frames.value.filter(frame => frame.ready).slice(-1),
			{ id: counter++, src, ready: false, scripts },
		]
	}

	function loaded(frame: Frame) {
		if (frame.id !== frames.value.at(-1)?.id) {
			return
		}
		const previous = frames.value.find(item => item.ready)
		const y = previous ? (elements.get(previous.id)?.contentWindow?.scrollY ?? 0) : 0
		frames.value = [{ ...frame, ready: true }]
		view.value = elements.get(frame.id)?.contentWindow ?? null
		void nextTick(() => elements.get(frame.id)?.contentWindow?.scrollTo(0, y))
	}

	return { frames, view, busy, latest, hidden, bind, show, loaded }
}

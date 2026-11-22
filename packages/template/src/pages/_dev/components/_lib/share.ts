import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { load, save } from './state.ts'

type Link = { url: string; qr: string }

export function useShare(path: () => string) {
	const links = ref<Link[]>([])
	const index = ref(0)
	const message = ref('Loading network addresses…')
	const current = computed(() => links.value[index.value])
	let controller: AbortController | undefined
	let favorite = ''

	async function refresh() {
		controller?.abort()
		const request = new AbortController()
		controller = request
		try {
			const query = encodeURIComponent(
				path() || location.pathname + location.search,
			)
			const base = import.meta.env.BASE_URL.replace(/\/$/, '')
			const response = await fetch(base + '/__lift/share?path=' + query, {
				signal: request.signal,
			})
			if (!response.ok) {
				throw new Error('Sharing unavailable')
			}
			const next = (await response.json()) as Link[]
			if (request.signal.aborted) {
				return
			}
			links.value = next
			index.value = Math.max(
				0,
				next.findIndex(link => new URL(link.url).hostname === favorite),
			)
			message.value = next.length
				? ''
				: 'Start with --host and connect your phone to the same network.'
		} catch {
			if (!request.signal.aborted) {
				links.value = []
				message.value = 'Network sharing is available on the development server.'
			}
		}
	}

	function move(direction: number) {
		index.value = (index.value + direction + links.value.length) % links.value.length
		const link = current.value
		if (link) {
			favorite = new URL(link.url).hostname
			save({ shareHost: favorite })
		}
	}

	onMounted(() => {
		favorite = load().shareHost ?? ''
		void refresh()
	})
	watch(path, refresh)
	onUnmounted(() => controller?.abort())
	return { current, index, links, message, move }
}

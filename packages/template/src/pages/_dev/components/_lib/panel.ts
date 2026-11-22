import { onMounted, onUnmounted, type Ref } from 'vue'
import { desktopQuery, save, setSize } from './state.ts'

type Side = 'bottom' | 'right'

const minimum = { bottom: 120, right: 280 }
const step = 24
const arrows: Record<string, number> = {
	ArrowUp: 1,
	ArrowLeft: 1,
	ArrowDown: -1,
	ArrowRight: -1,
}

function measure(divider: Ref<HTMLElement | null>, app: () => HTMLElement | null) {
	const sideOf = (): Side =>
		matchMedia(desktopQuery).matches && app()?.dataset.panel === 'right'
			? 'right'
			: 'bottom'

	function currentSize() {
		const panel = divider.value?.nextElementSibling?.getBoundingClientRect()
		return sideOf() === 'right' ? (panel?.width ?? 0) : (panel?.height ?? 0)
	}

	function resize(size: number) {
		const box = divider.value?.parentElement?.getBoundingClientRect()
		const root = app()
		if (!box || !root) {
			return 0
		}
		const side = sideOf()
		const total = side === 'right' ? box.width : box.height
		const min = Math.min(minimum[side], total * 0.45)
		const px = Math.round(Math.min(Math.max(size, min), total - min))
		setSize(root, `--docs-panel-${side}`, px)
		return px
	}

	return { sideOf, currentSize, resize }
}

function observePanel(divider: Ref<HTMLElement | null>, reclamp: () => void) {
	let observer: ResizeObserver | undefined
	onMounted(() => {
		observer = new ResizeObserver(reclamp)
		const workspace = divider.value?.parentElement
		if (workspace) {
			observer.observe(workspace)
		}
	})
	onUnmounted(() => observer?.disconnect())
}

export function usePanel(
	divider: Ref<HTMLElement | null>,
	app: () => HTMLElement | null,
) {
	const { sideOf, currentSize, resize } = measure(divider, app)
	observePanel(divider, () => resize(currentSize()))

	function drag(event: PointerEvent) {
		const target = divider.value
		const box = target?.parentElement?.getBoundingClientRect()
		const root = app()
		if (event.button !== 0 || !target || !box || !root) {
			return
		}
		event.preventDefault()
		const side = sideOf()
		let px = currentSize()
		const move = ({ clientX, clientY }: PointerEvent) => {
			px = resize(side === 'right' ? box.right - clientX : box.bottom - clientY)
		}
		target.setPointerCapture(event.pointerId)
		root.setAttribute('data-dragging', '')
		target.addEventListener('pointermove', move)
		target.addEventListener(
			'lostpointercapture',
			() => {
				target.removeEventListener('pointermove', move)
				root.removeAttribute('data-dragging')
				save({ [side]: px })
			},
			{ once: true },
		)
	}

	function resetSize() {
		const root = app()
		if (root) {
			const side = sideOf()
			setSize(root, `--docs-panel-${side}`, null)
			save({ [side]: null })
		}
	}

	function nudge(event: KeyboardEvent) {
		const direction = arrows[event.key]
		if (direction) {
			event.preventDefault()
			save({ [sideOf()]: resize(currentSize() + direction * step) })
		}
	}

	function togglePanel() {
		const root = app()
		if (root && matchMedia(desktopQuery).matches) {
			const panel = sideOf() === 'right' ? 'bottom' : 'right'
			root.dataset.panel = panel
			save({ panel })
		}
	}

	return { drag, resetSize, nudge, togglePanel }
}

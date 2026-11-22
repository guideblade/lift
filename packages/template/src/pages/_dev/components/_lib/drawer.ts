import { desktopQuery } from './state.ts'

export function bindDrawer(nav: HTMLElement) {
	const sheet = nav.querySelector<HTMLElement>('[data-docs-drawer]')
	const search = nav.querySelector<HTMLInputElement>('[data-docs-search]')
	const toggle = nav.querySelector<HTMLButtonElement>('[data-docs-toggle]')
	const desktop = matchMedia(desktopQuery)
	let opening = false
	if (!sheet || !search) {
		return
	}
	const sync = () => {
		if (desktop.matches) {
			sheet.removeAttribute('popover')
		} else {
			sheet.setAttribute('popover', 'auto')
		}
		toggle?.setAttribute('aria-expanded', 'false')
	}
	const open = () => {
		if (!desktop.matches && !opening && !sheet.matches(':popover-open')) {
			opening = true
			sheet.style.setProperty(
				'--docs-nav-bottom',
				nav.getBoundingClientRect().bottom + 'px',
			)
			try {
				sheet.showPopover()
			} finally {
				opening = false
			}
		}
	}
	sync()
	desktop.addEventListener('change', sync)
	search.addEventListener('click', open)
	search.addEventListener('input', open)
	search.addEventListener('keydown', event => {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			open()
		}
	})
	toggle?.addEventListener('click', () => {
		if (!sheet.matches(':popover-open')) {
			open()
		} else {
			sheet.hidePopover()
		}
	})
	sheet.addEventListener('toggle', () =>
		toggle?.setAttribute('aria-expanded', String(sheet.matches(':popover-open'))),
	)
	sheet.addEventListener('click', event => {
		const link =
			event.target instanceof Element && event.target.closest('a[data-docs-link]')
		if (link && !desktop.matches) {
			sheet.hidePopover()
		}
	})
}

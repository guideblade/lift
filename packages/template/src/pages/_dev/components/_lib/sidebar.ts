import { isToken } from './marks.ts'

const trimSlash = (path: string) => path.replace(/\/+$/, '')

function isEditable(target: EventTarget | null) {
	const element = target as HTMLElement | null
	return Boolean(
		element?.isContentEditable ||
		/^(INPUT|TEXTAREA|SELECT)$/.test(element?.tagName ?? ''),
	)
}

function bindFilter(
	nav: HTMLElement,
	input: HTMLInputElement,
	links: HTMLAnchorElement[],
) {
	const sections = [...nav.querySelectorAll<HTMLDetailsElement>('[data-docs-section]')]
	const empty = nav.querySelector<HTMLElement>('[data-docs-empty]')
	const filter = () => {
		const words = input.value.toLowerCase().split(/\s+/).filter(Boolean)
		for (const link of links) {
			const text = link.dataset.docsItem ?? ''
			const tokens = new Set((link.dataset.docsTokens ?? '').split(' '))
			link.hidden = !words.every(word =>
				isToken(word) ? tokens.has(word) : text.includes(word),
			)
		}
		for (const section of sections) {
			const matches = section.querySelector('[data-docs-item]:not([hidden])')
			section.hidden = !matches
			if (matches && words.length) {
				section.open = true
			}
		}
		if (empty) {
			empty.hidden = sections.some(section => !section.hidden)
		}
	}
	input.addEventListener('input', filter)
	document.addEventListener('click', event => {
		const badge =
			event.target instanceof Element
				? event.target.closest<HTMLElement>('[data-docs-filter]')
				: null
		const token = badge?.dataset.docsFilter
		if (token) {
			const words = input.value.split(/\s+/).filter(Boolean)
			input.value = (
				words.includes(token)
					? words.filter(word => word !== token)
					: [...words, token]
			).join(' ')
			filter()
		}
	})
	bindKeyboard(nav, input, links, filter)
}

function moveFocus(
	input: HTMLInputElement,
	links: HTMLAnchorElement[],
	direction: number,
) {
	const visible = links.filter(link => !link.hidden && link.closest('details')?.open)
	const index = visible.indexOf(document.activeElement as HTMLAnchorElement)
	const target =
		index === -1 && direction === -1 ? visible.at(-1) : visible[index + direction]
	;(target ?? input).focus()
}

function bindKeyboard(
	nav: HTMLElement,
	input: HTMLInputElement,
	links: HTMLAnchorElement[],
	filter: () => void,
) {
	const controls: HTMLElement[] = [input, ...links]
	nav.addEventListener('keydown', event => {
		const target = event.target
		if (!controls.includes(target as HTMLElement)) {
			return
		}
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault()
			moveFocus(input, links, event.key === 'ArrowDown' ? 1 : -1)
			return
		}
		if (event.key === 'Escape') {
			event.preventDefault()
			input.value = ''
			filter()
			if (target === input) {
				input.blur()
			} else {
				input.focus()
			}
		} else if (event.key === 'Enter' && target === input) {
			event.preventDefault()
			links.find(link => !link.hidden)?.click()
		}
	})
}

function bindShortcut(input: HTMLInputElement) {
	const shortcut = (event: KeyboardEvent) => {
		if (event.key === '/' && !isEditable(event.target)) {
			event.preventDefault()
			input.focus()
			input.click()
		}
	}
	document.addEventListener('keydown', shortcut)
	document.addEventListener(
		'load',
		({ target }) => {
			if (target instanceof HTMLIFrameElement) {
				target.contentWindow?.addEventListener('keydown', shortcut)
			}
		},
		true,
	)
}

export function bindSidebar(nav: HTMLElement) {
	const input = nav.querySelector<HTMLInputElement>('[data-docs-search]')
	const links = [...nav.querySelectorAll<HTMLAnchorElement>('[data-docs-item]')]
	if (input) {
		bindFilter(nav, input, links)
		bindShortcut(input)
	}

	const select = (url: URL) => {
		const path = trimSlash(url.pathname)
		const active = links.find(link => trimSlash(new URL(link.href).pathname) === path)
		for (const link of links) {
			if (link === active) {
				link.setAttribute('aria-current', 'page')
			} else {
				link.removeAttribute('aria-current')
			}
		}
		active?.closest('details')?.setAttribute('open', '')
		active?.scrollIntoView({ block: 'nearest' })
	}

	select(new URL(location.href))
	return { select }
}

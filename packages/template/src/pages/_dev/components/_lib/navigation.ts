type Swap = (main: HTMLElement, url: URL) => void

const mainSelector = '[data-docs-main]'
const fresh = 10_000
const cache = new Map<string, { at: number; page: Promise<Document> }>()

function fetchPage(path: string) {
	const cached = cache.get(path)
	if (cached && Date.now() - cached.at < fresh) {
		return cached.page
	}
	const page = fetch(path)
		.then(response =>
			response.ok
				? response.text()
				: Promise.reject(new Error(response.statusText)),
		)
		.then(html => new DOMParser().parseFromString(html, 'text/html'))
	page.catch(() => cache.delete(path))
	cache.set(path, { at: Date.now(), page })
	return page
}

function runScripts(root: HTMLElement) {
	for (const inert of root.querySelectorAll('script')) {
		const script = document.createElement('script')
		for (const { name, value } of inert.attributes) {
			script.setAttribute(name, value)
		}
		script.textContent = inert.textContent
		inert.replaceWith(script)
	}
}

const isPlainClick = (event: MouseEvent) =>
	event.button === 0 &&
	!event.defaultPrevented &&
	!event.metaKey &&
	!event.ctrlKey &&
	!event.shiftKey &&
	!event.altKey

const linkOf = (target: EventTarget | null) =>
	target instanceof Element
		? target.closest<HTMLAnchorElement>('a[data-docs-link]')
		: null

export function routeLinks(app: HTMLElement, swap: Swap) {
	let latest = ''

	const go = async (url: URL, push: boolean) => {
		latest = url.pathname
		const page = await fetchPage(url.pathname).catch(() => null)
		cache.delete(url.pathname)
		if (latest !== url.pathname) {
			return
		}
		const next = page?.querySelector<HTMLElement>(mainSelector)
		const main = app.querySelector<HTMLElement>(mainSelector)
		if (!page || !next || !main) {
			location.assign(url)
			return
		}
		if (push) {
			history.pushState(null, '', url)
		}
		document.title = page.title
		main.replaceWith(document.adoptNode(next))
		runScripts(next)
		swap(next, url)
	}

	app.addEventListener('click', event => {
		const link = linkOf(event.target)
		if (link && isPlainClick(event)) {
			event.preventDefault()
			const url = new URL(link.href)
			if (url.pathname !== location.pathname) {
				void go(url, true)
			}
		}
	})
	let hover: ReturnType<typeof setTimeout> | undefined
	app.addEventListener('pointerover', event => {
		const link = linkOf(event.target)
		clearTimeout(hover)
		if (link) {
			hover = setTimeout(
				() => void fetchPage(new URL(link.href).pathname).catch(() => {}),
				80,
			)
		}
	})
	addEventListener('popstate', () => void go(new URL(location.href), false))
}

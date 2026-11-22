import type { PageConfig } from '../page-config/pageConfig'

export type PageRoute = {
	pattern: string
	locale: string
	state: string | null
}

const join = (...segments: (string | null)[]) => `/${segments.filter(Boolean).join('/')}`

const trim = (path: string) => path.split('/').filter(Boolean).join('/')

export function pageRoutes(
	path: string,
	page: PageConfig,
	defaultLocale: string,
): PageRoute[] {
	const states = [null, ...(page.states ?? [])]
	return (page.locales ?? [defaultLocale]).flatMap(locale =>
		states.map(state => ({
			pattern: join(
				locale === defaultLocale ? null : locale,
				trim(path),
				state && `@${state}`,
			),
			locale,
			state,
		})),
	)
}

function splitLocale(segments: string[], page: PageConfig, defaultLocale: string) {
	const [first = '', ...rest] = segments
	return first !== defaultLocale && page.locales?.includes(first)
		? { locale: first, segments: rest }
		: { locale: defaultLocale, segments }
}

function splitState(segments: string[], page: PageConfig) {
	const state = segments.at(-1)?.slice(1) ?? ''
	return segments.at(-1)?.startsWith('@') && page.states?.includes(state)
		? { state, segments: segments.slice(0, -1) }
		: { state: null, segments }
}

export function pageRoute(
	pattern: string,
	page: PageConfig,
	defaultLocale: string,
): Omit<PageRoute, 'pattern'> & { path: string } {
	const localized = splitLocale(pattern.split('/').filter(Boolean), page, defaultLocale)
	const stated = splitState(localized.segments, page)
	return {
		path: stated.segments.join('/'),
		locale: localized.locale,
		state: stated.state,
	}
}

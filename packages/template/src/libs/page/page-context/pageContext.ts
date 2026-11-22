import type { PageConfig } from '../page-config/pageConfig'
import { pageRoute, pageRoutes } from '../page-routes/pageRoutes'

type Locale<P extends PageConfig> = P['locales'] extends readonly (infer L)[] ? L : string
type State<P extends PageConfig> = P['states'] extends readonly (infer S)[] ? S : never

export function pageContext<P extends PageConfig>(
	page: P,
	routePattern: string,
	language: string,
) {
	const { path, locale, state } = pageRoute(routePattern, page, language)
	const alternates = pageRoutes(path, page, language).filter(
		route => route.state === state,
	)
	return {
		locale: locale as Locale<P>,
		state: state as State<P> | null,
		alternates,
	}
}

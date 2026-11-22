import { defineConfig } from 'astro/config'
import tailwind from '@tailwindcss/vite'
import vue from '@astrojs/vue'
import sitemap from '@astrojs/sitemap'

import { aliases, getGitCommit, getMode, getProjectName } from './scripts/config/base'
import { config } from './src/site/config/site.config.ts'
import { getBase, getEnv, getSite } from './scripts/config/env'
import { devPages } from './scripts/config/devPages'
import { componentDocs } from './scripts/docs'
import { pageVariants } from './scripts/config/pageVariants'
import { fonts } from './scripts/config/fonts'
import { liftPlugins } from './scripts/config/plugins'
import { scssOptions } from './scripts/config/scss'
import { restartOn } from './scripts/config/restartOn'
import { share } from './scripts/config/share'

const mode = getMode()
const env = getEnv(mode)
const site = getSite(env)
const withSitemap =
	config.seo.enabled && config.seo.sitemap && Boolean(site) && mode === 'production'

export default defineConfig({
	site,
	base: getBase(env),
	fonts,
	experimental: {
		chromeDevtoolsWorkspace: true,
	},
	integrations: [
		vue(),
		devPages({ mode }),
		pageVariants({ mode, defaultLocale: config.site.language }),
		componentDocs({ preview: 'src/pages/_dev/components/preview/[...id].astro' }),
		restartOn(),
		share(),
		...(withSitemap
			? [
					sitemap({
						filter: page => {
							const { pathname } = new URL(page)
							return !pathname.endsWith('/404/') && !pathname.includes('/@')
						},
					}),
				]
			: []),
	],
	server: {
		host: true,
	},
	vite: {
		define: {
			'import.meta.env.__GIT_COMMIT__': JSON.stringify(getGitCommit()),
			'import.meta.env.__PROJECT_NAME__': JSON.stringify(getProjectName()),
			'import.meta.env.__SITEMAP__': JSON.stringify(withSitemap),
			__BEM__: JSON.stringify(config.bem),
			__ELEMENTS__: JSON.stringify(config.elements),
			'import.meta.env.__FAVICON_ENV__': JSON.stringify(env.FAVICON_ENV ?? null),
		},
		plugins: [tailwind(), ...liftPlugins],
		css: {
			preprocessorOptions: {
				scss: scssOptions,
			},
		},
		resolve: {
			alias: aliases,
		},
	},
})

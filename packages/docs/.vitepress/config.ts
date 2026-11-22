import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import { basePath } from './base.ts'
import { sidebar } from './sidebar.ts'

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('../../..', import.meta.url))

export default defineConfig({
	title: 'Lift',
	base: basePath(),
	srcDir: root,
	srcExclude: ['**/!(README|SKILL|BRIEF|CONTRIBUTING).md'],
	rewrites: { 'README.md': 'index.md' },
	outDir: 'dist',
	cleanUrls: true,
	ignoreDeadLinks: [/\.\w+$/],
	transformPageData(page) {
		if (/(^|\/)(SKILL|BRIEF|CONTRIBUTING)\.md$/.test(page.relativePath)) {
			page.frontmatter.prev = false
			page.frontmatter.next = false
		}
	},
	themeConfig: {
		sidebar: sidebar(root),
		search: { provider: 'local' },
		outline: [2, 3],
	},
	vite: {
		build: { target: 'esnext' },
		optimizeDeps: { esbuildOptions: { target: 'esnext' } },
		css: { preprocessorOptions: { scss: { api: 'modern-compiler' } } },
		resolve: {
			alias: { vue: dirname(require.resolve('vue/package.json')) },
		},
		server: {
			port: process.env.PORT ? Number(process.env.PORT) : undefined,
		},
	},
})

import { defineConfig } from '@playwright/test'
import { getBase, getEnv } from './scripts/config/env'

const port = 4329
const devURL = `http://127.0.0.1:${port}${getBase(getEnv('development')) ?? '/'}`
const externalURL = process.env.E2E_BASE_URL
const baseURL = new URL(externalURL ?? devURL)
baseURL.pathname = `${baseURL.pathname.replace(/\/+$/, '')}/`

export default defineConfig({
	testDir: './src/pages',
	testMatch: '**/_e2e/*.e2e.ts',
	testIgnore: '**/_blueprints/**',
	fullyParallel: true,
	forbidOnly: getEnv('test').CI,
	outputDir: '.playwright/results',
	reporter: [['list'], ['html', { open: 'never', outputFolder: '.playwright/report' }]],
	webServer: externalURL
		? undefined
		: {
				command: `pnpm exec astro dev --host 127.0.0.1 --port ${port} --ignore-lock`,
				// Playwright owns the server process, including when invoked by an agent.
				env: { ASTRO_DEV_BACKGROUND: '0' },
				url: devURL,
			},
	use: {
		baseURL: baseURL.href,
		trace: 'retain-on-failure',
	},
})

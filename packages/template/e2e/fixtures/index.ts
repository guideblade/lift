import { test as base, expect, type Page } from '@playwright/test'
import { config } from '@config'
import { pageRoutes, type PageConfig } from '@libs/page'
import { routeOf } from '../lib/routes'
import { settle } from '../lib/settle'
import { collectIssues } from './issues'

type Fixtures = {
	allowIssues: RegExp[]
	issues: void
	route: string
}

export const test = base.extend<Fixtures>({
	allowIssues: [[], { option: true }],
	issues: [
		async ({ page, allowIssues }, use) => {
			const log = collectIssues(page)
			await use()
			const issues = log.filter(
				issue => !allowIssues.some(pattern => pattern.test(issue)),
			)
			expect(issues, 'console errors, exceptions and failed requests').toEqual([])
		},
		{ auto: true },
	],
	route: async ({}, use, testInfo) => {
		await use(routeOf(testInfo.file))
	},
})

export { expect }

export function smokePage(
	options: { page?: PageConfig; suffix?: string; status?: number } = {},
) {
	return async ({ page, route }: { page: Page; route: string }) => {
		const { page: pageConfig, suffix, status = 200 } = options
		const path = suffix ? `${route.replace(/\/$/, '')}/${suffix}` : route
		const paths = new Set([path])
		if (pageConfig) {
			for (const { pattern } of pageRoutes(
				route,
				pageConfig,
				config.site.language,
			)) {
				paths.add(pattern)
			}
		}

		for (const url of paths) {
			await test.step(url, async () => {
				const response = await page.goto(`./${url.slice(1)}`)
				expect(response?.status()).toBe(status)
				await settle(page)
			})
		}
	}
}

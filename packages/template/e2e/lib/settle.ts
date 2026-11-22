import type { Page } from '@playwright/test'

export async function settle(page: Page) {
	await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
	await page.waitForLoadState('networkidle')
}

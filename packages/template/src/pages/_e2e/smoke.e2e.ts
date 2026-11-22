/** @reviewed null */
import { expect, smokePage, test } from '@e2e'

test('loads without browser errors', smokePage())

test('keyboard users can skip the site navigation', async ({ page }) => {
	await page.goto('./')
	const skipLink = page.getByRole('link', { name: 'Skip to main content' })
	await expect(skipLink).toHaveCSS('clip-path', 'inset(50%)')

	await page.keyboard.press('Tab')
	await expect(skipLink).toBeFocused()
	await expect(skipLink).toHaveCSS('clip-path', 'none')

	await page.keyboard.press('Enter')
	await expect(page.getByRole('main')).toBeFocused()
})

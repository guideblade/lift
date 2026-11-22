import type { ConsoleMessage, Page } from '@playwright/test'

function isDocumentStatus(message: ConsoleMessage, page: Page): boolean {
	return (
		message.location().url === page.url() &&
		message.text().startsWith('Failed to load resource')
	)
}

export function collectIssues(page: Page): string[] {
	const log: string[] = []

	page.on('console', message => {
		if (message.type() === 'error' && !isDocumentStatus(message, page)) {
			log.push(`console: ${message.text()} (${message.location().url})`)
		}
	})
	page.on('pageerror', error => {
		log.push(`exception: ${error.message}`)
	})
	page.on('requestfailed', request => {
		const reason = request.failure()?.errorText
		if (reason !== 'net::ERR_ABORTED') {
			log.push(`request: ${reason} ${request.url()}`)
		}
	})

	return log
}

import { existsSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { launch } from 'chrome-launcher'
import lighthouse, { desktopConfig, type Result } from 'lighthouse'
import { computeMedianRun, filterToValidRuns } from 'lighthouse/core/lib/median-run.js'
import type { Category, Preset } from './config.ts'

export type AuditOptions = {
	runs: number
	preset: Preset
	categories: Category[]
	chrome: string | undefined
}

const root = process.getuid?.() === 0
const flags = [
	'--headless=new',
	'--use-angle=swiftshader',
	'--enable-unsafe-swiftshader',
	...(root ? ['--no-sandbox', '--disable-dev-shm-usage'] : []),
]

export function chromePath() {
	if (process.env.CHROME_PATH) {
		return process.env.CHROME_PATH
	}
	const bundled = chromium.executablePath()
	return existsSync(bundled) ? bundled : undefined
}

async function once(url: string, options: AuditOptions): Promise<Result> {
	const chrome = await launch({
		chromePath: options.chrome,
		chromeFlags: flags,
		logLevel: 'silent',
	})
	try {
		const result = await lighthouse(
			url,
			{ port: chrome.port, logLevel: 'error', onlyCategories: options.categories },
			options.preset === 'desktop' ? desktopConfig : undefined,
		)
		if (!result) {
			throw new Error(`Lighthouse returned nothing for ${url}`)
		}
		return result.lhr
	} finally {
		chrome.kill()
	}
}

export async function audit(url: string, options: AuditOptions) {
	const runs: Result[] = []
	for (let run = 0; run < options.runs; run++) {
		runs.push(await once(url, options))
	}
	const valid = filterToValidRuns(runs)
	return valid.length > 0 ? computeMedianRun(valid) : runs[runs.length - 1]
}

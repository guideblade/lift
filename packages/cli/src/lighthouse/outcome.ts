import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Result } from 'lighthouse'
import { ReportGenerator } from 'lighthouse/report/generator/report-generator.js'
import type { Category, Level, Preset } from './config.ts'
import type { Page } from './pages.ts'

export type Status = 'pass' | 'warn' | 'fail' | 'off'

export type Score = {
	category: Category
	score: number | null
	min: number
	level: Level
	status: Status
	reasons: string[]
}

export type Outcome = {
	page: Page
	url: string
	report: string
	error: string | null
	scores: Score[]
}

export type Run = {
	preset: Preset
	runs: number
	outcomes: Outcome[]
}

export const categories: Category[] = [
	'performance',
	'accessibility',
	'best-practices',
	'seo',
]

export const labels: Record<Category, string> = {
	performance: 'Perf',
	accessibility: 'A11y',
	'best-practices': 'BP',
	seo: 'SEO',
}

const entities: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
}

export const escape = (text: string) =>
	text.replace(/[&<>"']/g, char => entities[char] ?? char)

export const percent = (score: number | null) =>
	score === null ? '-' : String(Math.round(score * 100))

function statusOf(level: Level, below: boolean): Status {
	if (level === 'off') {
		return 'off'
	}
	if (!below) {
		return 'pass'
	}
	return level === 'error' ? 'fail' : 'warn'
}

function reasons(lhr: Result, category: Category) {
	const refs = lhr.categories[category]?.auditRefs ?? []
	if (category === 'performance') {
		return refs
			.filter(ref => ref.group === 'metrics' && ref.weight > 0)
			.map(ref => lhr.audits[ref.id])
			.filter(audit => audit && audit.score !== null && audit.score < 0.9)
			.map(audit => `${audit.title}: ${audit.displayValue ?? percent(audit.score)}`)
	}
	return refs
		.filter(ref => ref.weight > 0)
		.map(ref => lhr.audits[ref.id])
		.filter(audit => audit && audit.score !== null && audit.score < 1)
		.map(audit => audit.title)
}

export function evaluate(page: Page, url: string, lhr: Result): Outcome {
	const scores = categories.map(category => {
		const { min, level } = page.thresholds[category]
		const score = lhr.categories[category]?.score ?? null
		const below = score === null || score < min
		const status = statusOf(level, below)
		return {
			category,
			score,
			min,
			level,
			status,
			reasons: below ? reasons(lhr, category) : [],
		}
	})
	return {
		page,
		url,
		report: `pages/${page.slug}.html`,
		error: lhr.runtimeError
			? `${lhr.runtimeError.code}: ${lhr.runtimeError.message}`
			: null,
		scores,
	}
}

export function writeReport(out: string, outcome: Outcome, lhr: Result) {
	writeFileSync(join(out, outcome.report), ReportGenerator.generateReportHtml(lhr))
	writeFileSync(join(out, `pages/${outcome.page.slug}.json`), JSON.stringify(lhr))
}

export const failed = (outcome: Outcome) =>
	outcome.error !== null || outcome.scores.some(score => score.status === 'fail')

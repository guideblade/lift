import {
	categories,
	escape,
	failed,
	labels,
	percent,
	type Run,
	type Score,
} from './outcome.ts'

function cell(score: Score) {
	const mark = score.status === 'fail' ? ' x' : score.status === 'warn' ? ' !' : ''
	return `${percent(score.score)}${mark}`
}

export function table({ outcomes }: Run) {
	const width = Math.max(4, ...outcomes.map(outcome => outcome.page.path.length))
	const head = [
		'Page'.padEnd(width),
		...categories.map(c => labels[c].padStart(6)),
	].join('  ')
	const rows = outcomes.map(outcome =>
		[
			outcome.page.path.padEnd(width),
			...outcome.scores.map(s => cell(s).padStart(6)),
		].join('  '),
	)
	return [head, '-'.repeat(head.length), ...rows].join('\n')
}

export function details({ outcomes }: Run) {
	const lines: string[] = []
	for (const outcome of outcomes) {
		const below = outcome.scores.filter(
			score => score.status === 'fail' || score.status === 'warn',
		)
		if (!outcome.error && below.length === 0) {
			continue
		}
		lines.push(`${outcome.page.path}  (${outcome.report})`)
		if (outcome.error) {
			lines.push(`  error  ${outcome.error}`)
		}
		for (const score of below) {
			lines.push(
				`  ${score.status === 'fail' ? 'error' : 'warn '}  ${score.category} ${percent(score.score)} < ${percent(score.min)}`,
			)
			for (const reason of score.reasons) {
				lines.push(`           - ${reason}`)
			}
		}
	}
	return lines.join('\n')
}

export function summary(run: Run) {
	return JSON.stringify(
		{
			preset: run.preset,
			runs: run.runs,
			pages: run.outcomes.map(outcome => ({
				path: outcome.page.path,
				url: outcome.url,
				report: outcome.report,
				passed: !failed(outcome),
				error: outcome.error,
				scores: Object.fromEntries(
					outcome.scores.map(({ category, reasons: _, ...rest }) => [
						category,
						rest,
					]),
				),
			})),
		},
		null,
		'\t',
	)
}

export function junit({ outcomes }: Run) {
	const suites = outcomes.map(outcome => {
		const cases = outcome.scores.map(score => {
			const name = `${escape(outcome.page.path)} ${score.category}`
			const head = `\t\t<testcase classname="lighthouse.${escape(outcome.page.slug)}" name="${name}">`
			const text = `${score.category} ${percent(score.score)} (min ${percent(score.min)}, ${score.level})`
			const why = escape(
				[text, ...score.reasons.map(reason => `- ${reason}`)].join('\n'),
			)
			if (score.status === 'off') {
				return `${head}<skipped/></testcase>`
			}
			if (score.status === 'fail') {
				return `${head}<failure message="${escape(text)}">${why}</failure></testcase>`
			}
			if (score.status === 'warn') {
				return `${head}<system-out>${why}</system-out></testcase>`
			}
			return `${head}</testcase>`
		})
		const error = outcome.error
			? [
					`\t\t<testcase classname="lighthouse.${escape(outcome.page.slug)}" name="${escape(outcome.page.path)} run"><error message="${escape(outcome.error)}"/></testcase>`,
				]
			: []
		const failures = outcome.scores.filter(score => score.status === 'fail').length
		return [
			`\t<testsuite name="${escape(outcome.page.path)}" tests="${cases.length + error.length}" failures="${failures}" errors="${error.length}">`,
			...cases,
			...error,
			'\t</testsuite>',
		].join('\n')
	})
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<testsuites name="Lighthouse">',
		...suites,
		'</testsuites>',
		'',
	].join('\n')
}

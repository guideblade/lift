import { categories, escape, failed, labels, percent, type Run } from './outcome.ts'

function tone(score: number | null) {
	if (score === null) {
		return 'none'
	}
	return score >= 0.9 ? 'good' : score >= 0.5 ? 'average' : 'poor'
}

export function index(run: Run) {
	const head = categories.map(category => `<th>${labels[category]}</th>`).join('')
	const rows = run.outcomes
		.map(outcome => {
			const cells = outcome.scores
				.map(
					score =>
						`<td class="${tone(score.score)} ${score.status}" title="min ${percent(score.min)}, ${score.level}">${percent(score.score)}</td>`,
				)
				.join('')
			const state = failed(outcome) ? 'fail' : 'pass'
			return `<tr><th scope="row"><a href="${escape(outcome.report)}">${escape(outcome.page.path)}</a></th>${cells}<td class="${state}">${state}</td></tr>`
		})
		.join('\n')
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lighthouse report</title>
<style>
:root { color-scheme: light dark; --good: #0c6; --average: #fa3; --poor: #f33; }
body { margin: 0 auto; padding: 24px 16px; max-width: 960px; font: 15px/1.5 system-ui, sans-serif; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 8px 12px; border-bottom: 1px solid color-mix(in srgb, currentColor 15%, transparent); text-align: right; }
th:first-child { text-align: left; }
td { font-variant-numeric: tabular-nums; font-weight: 600; }
.good { color: var(--good); }
.average { color: var(--average); }
.poor { color: var(--poor); }
td.fail { outline: 2px solid var(--poor); outline-offset: -4px; }
td.off { opacity: 0.45; }
td.warn { outline: 2px dashed var(--average); outline-offset: -4px; }
td.pass:last-child { color: var(--good); }
td.fail:last-child { color: var(--poor); outline: none; }
p { opacity: 0.75; }
</style>
</head>
<body>
<h1>Lighthouse report</h1>
<p>${run.outcomes.length} page(s), ${run.preset} preset, median of ${run.runs} run(s). Solid outline: below an error threshold. Dashed: below a warning threshold. Faded: not judged. Hover a score for its threshold.</p>
<table>
<thead><tr><th>Page</th>${head}<th>Result</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
</body>
</html>
`
}

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { rel, root } from '../project.ts'
import { audit, chromePath } from './audit.ts'
import { base, lighthouse } from './config.ts'
import { builtBase, devPagesIn, pagesIn } from './pages.ts'
import { index } from './html.ts'
import {
	categories,
	evaluate,
	failed,
	writeReport,
	type Outcome,
	type Run,
} from './outcome.ts'
import { details, junit, summary, table } from './output.ts'
import { serve } from './server.ts'

const write = (text = '') => process.stdout.write(`${text}\n`)

const dist = resolve(root(), lighthouse.dist)
const out = resolve(root(), lighthouse.out)

function unusable() {
	if (!existsSync(dist)) {
		return `${rel(dist)} not found`
	}
	const dev = devPagesIn(dist)
	if (dev.length > 0) {
		return `${rel(dist)} is not a production build (it has dev pages such as ${dev[0].path})`
	}
	const built = builtBase(dist)
	if (built !== null && built !== base) {
		return `${rel(dist)} was built for base ${built}, not ${base}`
	}
	return null
}

function build() {
	const result = spawnSync('pnpm build', { cwd: root(), stdio: 'inherit', shell: true })
	return result.status === 0
}

function save(run: Run) {
	writeFileSync(join(out, 'index.html'), index(run))
	writeFileSync(join(out, 'summary.json'), summary(run))
	writeFileSync(join(out, 'junit.xml'), junit(run))
}

export function ensureBuild(fresh: boolean) {
	if (!fresh) {
		const reason = unusable()
		if (reason) {
			write(`${reason}; run without --no-build to build it`)
		}
		return reason === null
	}
	if (!build()) {
		return false
	}
	write()
	return true
}

export async function main(runs = lighthouse.runs) {
	const pages = pagesIn(dist)
	if (pages.length === 0) {
		write(`no HTML pages to audit in ${rel(dist)}`)
		return false
	}

	const chrome = chromePath()
	write(
		`Lighthouse: ${pages.length} page(s), ${lighthouse.preset} preset, median of ${runs} run(s)`,
	)
	write(`Chrome: ${chrome ?? 'system Chrome'}\n`)

	rmSync(out, { recursive: true, force: true })
	mkdirSync(join(out, 'pages'), { recursive: true })

	const server = await serve(dist, base)
	const outcomes: Outcome[] = []
	try {
		for (const [position, page] of pages.entries()) {
			write(`[${position + 1}/${pages.length}] ${page.path}`)
			const url = `${server.origin}${base}${page.path.slice(1)}`
			const lhr = await audit(url, {
				runs,
				preset: lighthouse.preset,
				categories,
				chrome,
			})
			const outcome = evaluate(page, url, lhr)
			writeReport(out, outcome, lhr)
			outcomes.push(outcome)
		}
	} finally {
		await server.close()
	}

	const run: Run = { preset: lighthouse.preset, runs, outcomes }
	save(run)

	const failures = outcomes.filter(failed).length
	write(`\n${table(run)}\n`)
	const why = details(run)
	if (why) {
		write(`${why}\n`)
	}
	write(`${outcomes.length} page(s), ${failures} below an error threshold`)
	write(`Reports: ${pathToFileURL(join(out, 'index.html')).href}`)
	return failures === 0
}

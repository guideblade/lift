import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const commitFormat =
	'--format=%H%n  Date    : %cd (%cr)%n  Author  : %an <%ae>%n  Message : %s'

function commitInfo(root: string, commit: string) {
	try {
		return execFileSync('git', ['show', '-s', commitFormat, commit], {
			cwd: root,
			stdio: ['ignore', 'pipe', 'ignore'],
			encoding: 'utf8',
		}).trim()
	} catch {
		return ''
	}
}

export default {
	summary: 'Decode a trace token into its project, page and commit',
	args: [{ name: 'token', description: 'trace token from a page', required: true }],
	run: async ({ root, args, log, fail }) => {
		const { decodeTraceToken } = await import('../traceToken.ts')
		const decoded = decodeTraceToken((args.token ?? '').trim())
		if (!decoded) {
			return fail('Failed to decode trace token. Invalid token or mismatched salt.')
		}
		const pageDir =
			['src/pages', 'src/pages/_dev']
				.map(dir => `${dir}/${decoded.page}/_page.ts`)
				.find(path => existsSync(resolve(root, path))) ?? 'not found'

		log('\n[Trace Token Decoded]')
		log(`  Project : ${decoded.project}`)
		log(`  Page    : ${decoded.page} (${pageDir})`)
		log(`  Commit  : ${decoded.commit}`)
		const info = decoded.commit !== 'local' ? commitInfo(root, decoded.commit) : ''
		if (info) {
			log(`  Full SHA: ${info}`)
		}
		log('')
	},
} satisfies Lift.Command

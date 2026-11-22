import { ensureBuild, main as lighthouse } from '../lighthouse/main.ts'
import { dom, html, sass } from '../validate-build/main.ts'

export type Step = 'html' | 'dom' | 'sass' | 'lighthouse'

export type AuditOptions = {
	steps: readonly Step[]
	fresh: boolean
	runs: number | undefined
}

const steps: Record<Step, (runs?: number) => boolean | Promise<boolean>> = {
	html,
	dom,
	sass,
	lighthouse,
}

export async function audit({ steps: chosen, fresh, runs }: AuditOptions) {
	if (!ensureBuild(fresh)) {
		return 1
	}
	let passed = true
	for (const step of chosen) {
		passed = (await steps[step](runs)) && passed
	}
	return passed ? 0 : 1
}

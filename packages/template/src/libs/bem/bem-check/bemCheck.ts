import type { Bem } from '../create-block/createBlock'

declare const __BEM__: Bem

const fix =
	'Restart the dev server, then clear the browser cache (DevTools: right-click reload, Empty Cache and Hard Reload).'

export function bemMismatch(source: string, found: string, expected: string): Error {
	return new Error(
		`[bem] ${source} uses \`${found}\`, but config.bem gives \`${expected}\`. The BEM delimiters changed: ${fix}`,
	)
}

export function checkBemConfig(current: Bem): void {
	const started = JSON.stringify(__BEM__)
	const expected = JSON.stringify(current)
	if (import.meta.env.DEV && started !== expected) {
		throw bemMismatch('The dev server', started, expected)
	}
}

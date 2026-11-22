import { ownConventions } from '@/_conventions/owner.ts'
import { family, rule } from '@/_conventions/rules.ts'

export const site = family('site', {
	ownConventions: rule('`config` runs its own `_conventions/index.ts`', () =>
		ownConventions(['config', ['layer', 'folder']]),
	),
})

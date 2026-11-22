export default {
	contract: 1,
	base: async () => {
		const { getBase, getEnv } = await import('./scripts/config/env.ts')
		return getBase(getEnv('production'))
	},
	devRoutes: async () => (await import('./scripts/config/devPages.ts')).devRoutes(),
	lighthouse: {
		pages: [
			{ match: '/404.html', thresholds: { seo: { min: 1, level: 'off' } } },
			{ match: /\/@[^/]+\/$/, thresholds: { seo: { min: 1, level: 'off' } } },
		],
	},
	validateBuild: {
		sassFunctions: ['pxr', 'breakpoint', 'data-attribute', 'instance-state'],
	},
	checks: [
		{
			name: 'oxfmt',
			files: /\.(ts|tsx|js|mjs|cjs|json|jsonc|md|css|scss|vue|astro)$/,
			bin: 'oxfmt',
			args: ['--check'],
		},
		{
			name: 'oxlint',
			files: /\.(ts|tsx|js|mjs|cjs|vue|astro)$/,
			bin: 'oxlint',
			args: ['--deny-warnings'],
		},
		{
			name: 'stylelint',
			files: /^src\/.*\.(css|scss|astro)$/,
			bin: 'stylelint',
			args: ['--allow-empty-input'],
		},
		{
			name: 'types',
			files: /\.(ts|astro|vue)$/,
			bin: 'astro',
			args: ['check'],
			whole: true,
			hook: false,
		},
	],
} satisfies Lift.Config

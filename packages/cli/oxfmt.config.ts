import { defineConfig } from 'oxfmt'

export default defineConfig({
	printWidth: 90,
	tabWidth: 4,
	useTabs: true,
	semi: false,
	singleQuote: true,
	trailingComma: 'all',
	arrowParens: 'avoid',
	bracketSpacing: true,
	bracketSameLine: true,
	endOfLine: 'lf',
	ignorePatterns: ['**/_generated/**'],
	overrides: [
		{
			files: ['**/*.json', '**/*.jsonc'],
			options: {
				trailingComma: 'none',
			},
		},
	],
})

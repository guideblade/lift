import { defineConfig } from 'oxlint'

export default defineConfig({
	categories: {
		correctness: 'error',
	},
	plugins: ['typescript', 'oxc', 'vue'],
	env: {
		browser: true,
	},
	ignorePatterns: ['dist', '**/_generated/**'],
	rules: {
		'max-lines': [
			'error',
			{
				max: 200,
				skipBlankLines: false,
				skipComments: false,
			},
		],
		'max-lines-per-function': [
			'warn',
			{
				max: 60,
				skipBlankLines: true,
				skipComments: true,
			},
		],
		'max-depth': ['warn', 3],
		complexity: ['warn', 10],
		'max-params': ['warn', 4],
		'no-console': [
			'warn',
			{
				allow: ['warn', 'error'],
			},
		],
		'no-debugger': 'error',
		'no-alert': 'error',
		'no-duplicate-imports': 'error',
		'no-unreachable': 'error',
		'no-else-return': 'warn',
		'no-lonely-if': 'warn',
		'prefer-const': 'error',
		eqeqeq: ['error', 'always'],
		curly: ['error', 'all'],
		'no-unused-vars': 'off',
		'typescript/no-unused-vars': [
			'warn',
			{
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_',
			},
		],
		'typescript/consistent-type-imports': [
			'error',
			{
				prefer: 'type-imports',
				fixStyle: 'separate-type-imports',
			},
		],
		'typescript/no-explicit-any': 'warn',
		'typescript/no-empty-object-type': 'warn',
		'typescript/no-non-null-assertion': 'warn',
	},
})

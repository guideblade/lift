import { fontProviders, type defineConfig } from 'astro/config'

type LocalFontProvider = ReturnType<typeof fontProviders.local>
type FontsConfig = NonNullable<
	Parameters<typeof defineConfig<never, never, LocalFontProvider[]>>[0]
>['fonts']

const sansFallbacks = ['Arial', 'system-ui', 'sans-serif']
const serifFallbacks = ['Georgia', 'serif']
const monoFallbacks = ['ui-monospace', 'monospace']

export const fonts: FontsConfig = [
	{
		provider: fontProviders.local(),
		name: 'Cal Sans',
		cssVariable: '--font-cal-sans',
		formats: ['woff2', 'woff'],
		display: 'swap',
		fallbacks: sansFallbacks,
		options: {
			variants: [
				{
					src: [
						'./src/site/assets/fonts/cal-sans/cal-sans.woff2',
						'./src/site/assets/fonts/cal-sans/cal-sans.woff',
					],
					weight: 600,
				},
			],
		},
	},
	{
		provider: fontProviders.local(),
		name: 'Inter',
		cssVariable: '--font-inter',
		formats: ['ttf'],
		display: 'swap',
		fallbacks: sansFallbacks,
		options: {
			variants: [
				{
					src: ['./src/site/assets/fonts/inter/inter.ttf'],
					weight: '100 900',
				},
			],
		},
	},
	{
		provider: fontProviders.local(),
		name: 'Faculty Glyphic',
		cssVariable: '--font-faculty-glyphic',
		formats: ['woff2', 'woff', 'ttf'],
		display: 'swap',
		fallbacks: serifFallbacks,
		options: {
			variants: [
				{
					src: [
						'./src/site/assets/fonts/faculty-glyphic/faculty-glyphic.woff2',
						'./src/site/assets/fonts/faculty-glyphic/faculty-glyphic.woff',
						'./src/site/assets/fonts/faculty-glyphic/faculty-glyphic.ttf',
					],
					weight: 400,
				},
			],
		},
	},
	{
		provider: fontProviders.local(),
		name: 'JetBrains Mono',
		cssVariable: '--font-jetbrains-mono',
		formats: ['ttf'],
		display: 'swap',
		fallbacks: monoFallbacks,
		options: {
			variants: [
				{
					src: ['./src/site/assets/fonts/jetbrains-mono/jetbrains-mono.ttf'],
					weight: 600,
				},
			],
		},
	},
]

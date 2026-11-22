import type { AppConfig } from './types'

export type { AppConfig, ServiceSettings } from './types'

// Breakpoint values are in rem.
export const tailwindBreakpoints = {
	sm: 40,
	md: 48,
	lg: 64,
	xl: 80,
	'2xl': 96,
} as const

export const deviceBreakpoints = {
	medium: 'md',
	large: 'lg',
} as const satisfies Record<
	Exclude<keyof AppConfig['devices'], 'small'>,
	keyof typeof tailwindBreakpoints
>

export type TailwindBreakpoint =
	| 0
	| (typeof tailwindBreakpoints)[keyof typeof tailwindBreakpoints]

export const config: AppConfig = {
	site: {
		name: 'Lift',
		language: 'en',
		description:
			'Lift is an Astro frontend template with TypeScript, Vue islands, Tailwind CSS and SCSS.',
		image: null,
		title: page => (page ? `${page} | Lift` : 'Lift'),
	},
	seo: {
		enabled: true,
		indexing: true,
		sitemap: true,
	},
	services: {
		lenis: {
			enabled: true,
			options: {
				lerp: 0.2,
				anchors: true,
				stopInertiaOnNavigate: true,
			},
		},
		anime: {
			enabled: true,
			reducedMotion: '(prefers-reduced-motion: reduce)',
			defaults: {
				duration: 1000,
				ease: 'out(2)',
			},
		},
		proximity: {
			enabled: true,
			radius: 160,
			media: '(hover: hover) and (pointer: fine)',
		},
		scrollbar: {
			enabled: true,
			mode: 'opt-out',
			page: '',
			exclude: 'textarea, select, [contenteditable]',
			idle: 1000,
			options: {
				scrollbars: {
					autoHide: 'never',
					autoHideSuspend: true,
					clickScroll: 'instant',
				},
			},
		},
		reveal: {
			enabled: true,
			once: false,
			mirror: false,
			rootMargin: '0px 0px -10% 0px',
			reducedMotion: '(prefers-reduced-motion: reduce)',
			defaults: {
				preset: 'fade-up',
				duration: 600,
				ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
				distance: '2rem',
			},
		},
	},
	elements: {
		prefix: 'lift',
	},
	bem: {
		element: '__',
		modifier: '_',
		state: 'is-',
	},
	devices: {
		small: 0,
		medium: tailwindBreakpoints[deviceBreakpoints.medium],
		large: tailwindBreakpoints[deviceBreakpoints.large],
	},
	fluid: {
		designWidth: 1920,
		share: 0.5,
		maxScale: 1.5,
	},
}

export function viewportQuery(phase: keyof AppConfig['devices']) {
	return `(width >= ${config.devices[phase]}rem)`
}

import type { FooterContent } from '../../model/footer'

export const sample = {
	text: '© 2026 Lift',
	links: [
		{ label: 'Blog', href: '/blog/markdown' },
		{ label: 'Components', href: '/components' },
	],
} satisfies FooterContent

import type { HeaderNavContent } from '../../model/header-nav'
import LevelContacts from './level-contacts.slot.astro'
import Logo from './logo.slot.astro'
import PanelCatalog from './panel-catalog.slot.astro'
import PanelCompany from './panel-company.slot.astro'

export const sample = {
	start: [
		{ label: 'Catalog', panel: 'catalog' },
		{ label: 'Docs', href: '#docs' },
	],
	end: [
		{ label: 'Blog', href: '#blog' },
		{ label: 'Company', panel: 'company' },
	],
	menuItems: [
		{
			label: 'Catalog',
			items: [
				{
					label: 'Shoes',
					items: [
						{ label: 'Running', href: '#running' },
						{ label: 'Trail', href: '#trail' },
					],
				},
				{ label: 'Bags', href: '#bags' },
			],
		},
		{ label: 'Docs', href: '#docs' },
		{ label: 'Blog', href: '#blog' },
		{
			label: 'Company',
			items: [
				{ label: 'About', href: '#about' },
				{ label: 'Contacts', level: 'contacts' },
			],
		},
	],
	sampleSlots: {
		logo: Logo,
		'panel-catalog': PanelCatalog,
		'panel-company': PanelCompany,
		'level-contacts': LevelContacts,
	},
} satisfies HeaderNavContent

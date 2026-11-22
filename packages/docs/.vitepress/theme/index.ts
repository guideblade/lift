import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import Levels from './Levels.vue'
import './styles/index.scss'

export default {
	extends: DefaultTheme,
	Layout: () =>
		h(DefaultTheme.Layout, null, {
			'doc-before': () => h(Levels, { placement: 'before' }),
			'doc-after': () => h(Levels, { placement: 'after' }),
		}),
} satisfies Theme

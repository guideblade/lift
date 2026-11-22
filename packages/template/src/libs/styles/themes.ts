import './themes.scss'

const themes = import.meta.glob(['./themes/*.scss', '!./themes/_*.scss'], { eager: true })

export const colorSchemes: readonly string[] = ['light', 'dark']
export const defaultTheme = 'mono'
export const themeNames = [
	defaultTheme,
	...Object.keys(themes)
		.map(path => path.slice('./themes/'.length, -'.scss'.length))
		.sort(),
]

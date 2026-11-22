import type { Config } from 'tailwindcss'
import {
	deviceBreakpoints,
	tailwindBreakpoints,
} from '../../src/site/config/site.config.ts'

export default {
	theme: {
		screens: Object.fromEntries(
			Object.values(deviceBreakpoints).map(name => [
				name,
				`${tailwindBreakpoints[name]}rem`,
			]),
		),
	},
} satisfies Config

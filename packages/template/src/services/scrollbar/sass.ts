import { config } from '../../site/config/site.config.ts'
import {
	ServiceScrollbarState,
	serviceScrollbarNative,
	serviceScrollbarVariables,
} from './lib/scrollbarState'

const list = (values: readonly string[]) =>
	`(${values.map(value => `'${value}'`).join(', ')},)`

export default [
	`$scrollbar-mode: '${config.services.scrollbar.mode}';`,
	`$scrollbar-native: '${serviceScrollbarNative}';`,
	`$scrollbar-states: ${list(Object.values(ServiceScrollbarState))};`,
	`$scrollbar-variables: ${list(serviceScrollbarVariables)};`,
].join('\n')

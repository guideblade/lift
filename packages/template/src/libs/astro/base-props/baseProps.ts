import type { HoverMode } from '../../attributes/data-attribute/dataAttribute'

export type BaseProps<TVariant extends string = never> = {
	class?: string
	variant?: 'primary' | TVariant
	hover?: HoverMode
	hoverSource?: boolean
}

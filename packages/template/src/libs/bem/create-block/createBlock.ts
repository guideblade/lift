export type Bem = { element: string; modifier: string; state: string }

declare const __BEM__: Bem

const delimiters = () => __BEM__

export function createBlock(name: string) {
	const bem = delimiters()
	const modifier = (mod: string) => `${name}${bem.modifier}${mod}`

	const data = (key: string) =>
		`data-${name}-${key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`

	return {
		block: name,

		element(el: string) {
			return `${name}${bem.element}${el}`
		},

		modifier,

		variant(variant: string) {
			return modifier(`variant-${variant}`)
		},

		state(state: string) {
			return `${bem.state}${state}`
		},

		data,

		dataset(values: Record<string, string | number | undefined>) {
			return Object.fromEntries(
				Object.entries(values).map(([key, value]) => [
					data(key),
					value === undefined ? undefined : String(value),
				]),
			)
		},
	}
}

export type Block = ReturnType<typeof createBlock>

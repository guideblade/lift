export const toPascal = (input: string) =>
	input
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.split(/[^a-zA-Z0-9]+/)
		.filter(Boolean)
		.map(part => part[0].toUpperCase() + part.slice(1).toLowerCase())
		.join('')

export const toKebab = (input: string) =>
	toPascal(input)
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.toLowerCase()

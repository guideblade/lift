import { relative, sep } from 'node:path'

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

export const toCamel = (input: string) => {
	const pascal = toPascal(input)
	return pascal ? pascal[0].toLowerCase() + pascal.slice(1) : ''
}

export const toPath = (input: string) => input.split('/').map(toKebab).filter(Boolean)

export const posix = (root: string, path: string) =>
	relative(root, path).split(sep).join('/')

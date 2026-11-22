import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const phases = ['small', 'medium', 'large']

type VariantMap = Map<string, Map<string, Map<string, string>>>

function splitProperties(source: string) {
	const properties: string[] = []
	let depth = 0
	let start = 0

	for (let index = 0; index < source.length; index += 1) {
		if (source[index] === '(') {
			depth += 1
		}
		if (source[index] === ')') {
			depth -= 1
		}
		if (source[index] === ',' && depth === 0) {
			properties.push(source.slice(start, index))
			start = index + 1
		}
	}
	properties.push(source.slice(start))
	return properties
}

function parseDegreeProperties(body: string) {
	const values = new Map<string, string>()
	for (const property of splitProperties(body)) {
		const match = property.match(/\$([\w-]+)\s*:\s*([\s\S]+)/)
		if (match) {
			values.set(match[1], match[2].trim())
		}
	}
	return values
}

function parsePhaseDegrees(body: string, phase: string, result: VariantMap) {
	for (const degreeMatch of body.matchAll(
		/@include\s+degree\(\s*(\d+)\s*,([\s\S]*?)\);/g,
	)) {
		const degree = degreeMatch[1]
		const values = parseDegreeProperties(degreeMatch[2])
		let degreeMap = result.get(degree)
		if (!degreeMap) {
			degreeMap = new Map()
			result.set(degree, degreeMap)
		}
		degreeMap.set(phase, values)
	}
}

function parseVariant(source: string) {
	const result: VariantMap = new Map()
	for (const phaseMatch of source.matchAll(
		/@mixin\s+(small|medium|large)\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/g,
	)) {
		parsePhaseDegrees(phaseMatch[2], phaseMatch[1], result)
	}
	return result
}

function formatValue(value: string) {
	return value.replace(/\s+/g, ' ').replaceAll('*/', '').trim()
}

function typeName(variant: string) {
	return `${variant.slice(0, 1).toUpperCase()}${variant.slice(1)}TextForm`
}

function collectVariantProperties(entries: VariantMap, degree: string) {
	const properties = new Set<string>()
	for (const phase of phases) {
		const phaseKeys = entries.get(degree)?.get(phase)?.keys() ?? []
		for (const key of phaseKeys) {
			properties.add(key)
		}
	}
	return properties
}

function formatPropertyPhases(entries: VariantMap, degree: string, property: string) {
	const values: string[] = []
	for (const phase of phases) {
		const value = entries.get(degree)?.get(phase)?.get(property)
		if (value) {
			values.push(formatValue(value))
		}
	}
	return `${property}: ${values.join(' → ')}`
}

function buildDegreeDocs(
	variant: string,
	entries: VariantMap,
	variantDocs: Map<string, Map<string, string>>,
	docs: string[],
) {
	const variantDegreeDocs = new Map<string, string>()
	variantDocs.set(variant, variantDegreeDocs)

	const sortedDegrees = [...entries.keys()].sort((a, b) => Number(a) - Number(b))
	for (const degree of sortedDegrees) {
		const properties = [...collectVariantProperties(entries, degree)].sort()
		const descriptions = properties.map(prop =>
			formatPropertyPhases(entries, degree, prop),
		)
		const description = `${variant} / ${degree}: ${descriptions.join('; ')}`
		docs.push(` * - ${description}`)
		variantDegreeDocs.set(degree, description)
	}
}

function variantPropsName(variant: string) {
	return `${variant.slice(0, 1).toUpperCase()}${variant.slice(1)}VariantProps`
}

function buildVariantProps(
	variants: Map<string, VariantMap>,
	variantDocs: Map<string, Map<string, string>>,
) {
	return [
		...[...variants.keys()].flatMap(variant => [
			`type ${variantPropsName(variant)} = {`,
			`\tvariant${variant === 'primary' ? '?' : ''}: '${variant}'`,
			'\t/**',
			'\t * Text degree. Responsive values by phase:',
			...[...(variantDocs.get(variant)?.values() ?? [])].flatMap((line, index) =>
				index === 0 ? [`\t * - ${line}`] : ['\t *', `\t * - ${line}`],
			),
			'\t */',
			`\tform?: TextFormByVariant['${variant}']`,
			'}',
		]),
		`export type TextVariantProps = ${[...variants.keys()].map(variantPropsName).join(' | ') || 'never'}`,
	]
}

export function buildGeneratedDefinitions(
	variants: Map<string, VariantMap>,
	variantDocs: Map<string, Map<string, string>>,
	docs: string[],
) {
	return [
		'/**',
		' * This file is generated from src/components/primitives/text/ui/variant/*.scss.',
		' * Do not edit it manually.',
		' *',
		...docs.flatMap((line, index) => (index === 0 ? [line] : [' *', line])),
		' */',
		...[...variants.entries()].flatMap(([variant, entries]) => [
			`export interface ${typeName(variant)}Definitions {`,
			...[...entries.keys()]
				.sort((a, b) => Number(a) - Number(b))
				.flatMap(degree => [
					`\t/** ${variantDocs.get(variant)?.get(degree) ?? ''} */`,
					`\t'${degree}': '${degree}'`,
				]),
			'}',
			`export type ${typeName(variant)} = keyof ${typeName(variant)}Definitions`,
		]),
		'export interface TextFormByVariant {',
		...[...variants.keys()].map(variant => `\t${variant}: ${typeName(variant)}`),
		'}',
		`export type TextForm = TextFormByVariant[keyof TextFormByVariant]`,
		`export type TextVariant = ${[...variants.keys()].map(variant => `'${variant}'`).join(' | ') || 'never'}`,
		...buildVariantProps(variants, variantDocs),
		'',
	].join('\n')
}

export function parseTextVariants(variantsRoot: string) {
	const variantFiles = readdirSync(variantsRoot, { withFileTypes: true })
		.filter(entry => entry.isFile() && entry.name.endsWith('.scss'))
		.sort((a, b) => a.name.localeCompare(b.name))

	const variants = new Map<string, VariantMap>()
	for (const file of variantFiles) {
		const name = file.name.replace(/\.scss$/, '')
		const source = readFileSync(resolve(variantsRoot, file.name), 'utf8')
		variants.set(name, parseVariant(source))
	}

	const docs: string[] = []
	const variantDocs = new Map<string, Map<string, string>>()
	for (const [variant, entries] of variants) {
		buildDegreeDocs(variant, entries, variantDocs, docs)
	}

	return { variants, variantDocs, docs }
}

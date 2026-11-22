import { resolve } from 'node:path'
import type { PhaseModel } from './photoGenerator.ts'
import { GENERATED_FORMATS, SCOPES_MODULE } from './photoValidator.ts'

export interface ScopeModel {
	id: string
	phases: PhaseModel[]
}

function scopesDeclaration(scope: string, local: boolean) {
	const entry = `'${scope}': (typeof names)[number]`
	if (!local) {
		return ['export interface PhotoScopes {', `\t${entry}`, '}']
	}
	return [
		`declare module '${SCOPES_MODULE}' {`,
		'\tinterface PhotoScopes {',
		`\t\t${entry}`,
		'\t}',
		'}',
	]
}

export function registryCode(scope: string, names: string[], local: boolean) {
	const list = names.length ? `[\n${names.map(n => `\t'${n}',`).join('\n')}\n]` : '[]'
	return [
		...(local ? [`import type { PhotoScopes } from '${SCOPES_MODULE}'`, ''] : []),
		`const scope = '${scope}'`,
		'',
		`const names = ${list} as const`,
		'',
		...scopesDeclaration(scope, local),
		'',
		'export type PhotoName = PhotoScopes[typeof scope]',
		'',
		'export default scope',
		'',
	].join('\n')
}

function toImportPath(path: string) {
	return path.replace(/\\/g, '/')
}

export function virtualModuleCode(scopes: ScopeModel[], cacheDir: string) {
	const imports: string[] = []
	const ref = (path: string) => {
		const id = `i${imports.length}`
		imports.push(`import ${id} from ${JSON.stringify(toImportPath(path))}`)
		return id
	}

	const phaseCode = (model: PhaseModel) => {
		const candidates = GENERATED_FORMATS.map(format => {
			const list = model.outputs
				.filter(output => output.format === format)
				.sort((a, b) => a.width - b.width)
				.map(
					output =>
						`{ src: ${ref(resolve(cacheDir, output.file))}.src, width: ${output.width} }`,
				)
			return `${format}: [${list.join(', ')}]`
		})
		return `{ fallback: ${ref(model.fallback)}, width: ${model.width}, height: ${model.height}, candidates: { ${candidates.join(', ')} } }`
	}

	const scopeCode = (scope: ScopeModel) => {
		const names = new Map<string, string[]>()
		for (const model of scope.phases) {
			const entries = names.get(model.name) ?? []
			entries.push(`${JSON.stringify(model.phase)}: ${phaseCode(model)}`)
			names.set(model.name, entries)
		}
		const body = [...names].map(
			([name, entries]) => `${JSON.stringify(name)}: { ${entries.join(', ')} }`,
		)
		return `${JSON.stringify(scope.id)}: { ${body.join(', ')} }`
	}

	const body = scopes.map(scopeCode).join(',\n')
	return `${imports.join('\n')}\nexport default {\n${body}\n}\n`
}

import { dirname, resolve, sep } from 'node:path'
import ts from 'typescript'

export const external = (file: string) => file.includes('/node_modules/')

const cache = new Map<string, ts.SourceFile>()

let options: ts.CompilerOptions | undefined
let previous: ts.Program | undefined

function compilerOptions(base: string): ts.CompilerOptions {
	if (!options) {
		const file = resolve(base, 'tsconfig.json')
		const config = ts.readConfigFile(file, ts.sys.readFile).config ?? {}
		const parsed = ts.parseJsonConfigFileContent(
			{ ...config, include: [] },
			ts.sys,
			base,
			undefined,
			file,
		)
		options = { ...parsed.options, noEmit: true, skipLibCheck: true }
	}
	return options
}

const astroModule = (files: Map<string, string>, name: string, from: string) => {
	const file = `${resolve(dirname(from), name).split(sep).join('/')}.ts`
	return files.has(file)
		? {
				resolvedModule: {
					resolvedFileName: file,
					extension: ts.Extension.Ts,
					isExternalLibraryImport: false,
				},
			}
		: null
}

function createHost(compiler: ts.CompilerOptions, files: Map<string, string>) {
	const host = ts.createCompilerHost(compiler, true)
	const { fileExists, readFile, getSourceFile } = host
	host.resolveModuleNameLiterals = (literals, containingFile, redirected, options) =>
		literals.map(
			({ text }) =>
				(text.endsWith('.astro') && astroModule(files, text, containingFile)) ||
				ts.resolveModuleName(
					text,
					containingFile,
					options,
					host,
					undefined,
					redirected,
				),
		)
	host.fileExists = name => files.has(name) || fileExists.call(host, name)
	host.readFile = name => files.get(name) ?? readFile.call(host, name)
	host.getSourceFile = (name, language, ...rest) => {
		const text = files.get(name)
		if (text !== undefined) {
			return ts.createSourceFile(name, text, language, true)
		}
		const cached = cache.get(name)
		if (cached) {
			return cached
		}
		const file = getSourceFile.call(host, name, language, ...rest)
		if (file && external(name)) {
			cache.set(name, file)
		}
		return file
	}
	return host
}

export function createProgram(
	base: string,
	files: Map<string, string>,
	extra: string[] = [],
) {
	const compiler = compilerOptions(base)
	previous = ts.createProgram({
		rootNames: [...files.keys(), ...extra],
		options: compiler,
		host: createHost(compiler, files),
		oldProgram: previous,
	})
	return previous
}

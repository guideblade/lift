import type { Dirent } from 'node:fs'
import type {
	AttributeNode,
	ElementNode,
	Node,
	RootNode,
	TagLikeNode,
} from '@astrojs/compiler/types'
import type {
	Class,
	Expression,
	ObjectExpression,
	ObjectPattern,
	Program,
	Span,
	TSTypeReference,
	VariableDeclarator,
} from 'oxc-parser'
import type { Root } from 'postcss'

declare global {
	namespace Lift {
		type Config = {
			contract: 1
			template?: { from: string; commit: string }
			base?: () => Promise<string | undefined>
			devRoutes?: () => Promise<string[]>
			lighthouse?: LighthouseConfig
			validateBuild?: ValidateBuildConfig
			checks?: FileCheck[]
		}

		type FileCheck = {
			name: string
			files: RegExp
			bin: string
			package?: string
			args?: string[]
			whole?: boolean
			hook?: boolean
		}

		type Category = 'performance' | 'accessibility' | 'best-practices' | 'seo'
		type Level = 'error' | 'warn' | 'off'
		type Threshold = { min: number; level: Level }
		type Thresholds = Record<Category, Threshold>
		type PageRule = {
			match: string | RegExp
			thresholds?: Partial<Thresholds>
			skip?: boolean
		}

		type LighthouseConfig = {
			dist?: string
			out?: string
			runs?: number
			preset?: 'mobile' | 'desktop'
			thresholds?: Partial<Thresholds>
			pages?: PageRule[]
		}

		type DomTier = { label: string; below: number; level: 'ok' | 'warn' | 'fail' }

		type ValidateBuildConfig = {
			dist?: string
			dom?: DomTier[]
			sassFunctions?: string[]
		}

		type CommandArg = { name: string; description?: string; required?: boolean }

		type CommandFlag = {
			name: string
			description?: string
			type?: 'boolean' | 'string' | 'project'
			exclusive?: string[]
		}

		type Choice = { label: string; search: readonly string[] }

		type Files = {
			create(path: string, content: string): Promise<string>
			update(
				path: string,
				edit: (content: string) => string | Promise<string>,
			): Promise<string>
			track(path: string): Promise<string>
			copy(from: string, to: string): Promise<string>
		}

		type CommandContext = {
			root: string
			cwd: string
			args: Record<string, string | undefined>
			flags: Record<string, string | boolean | undefined>
			interactive: boolean
			log: (text: string) => void
			fail: (message: string) => never
			ask: (question: string) => Promise<string>
			pick: <T extends Choice>(
				items: readonly T[],
				title: string,
				chosen: (item: T) => string,
			) => Promise<T>
			files: Files
			help: () => Promise<void>
		}

		type Command = {
			summary: string
			description?: string
			examples?: string[]
			args?: CommandArg[]
			flags?: CommandFlag[]
			run: (context: CommandContext) => void | Promise<void>
		}

		type Violation = { rule: string; file: string; line?: number; message: string }

		type Check = {
			id: string
			description: string
			inner?: () => readonly Check[]
			run: (scope: Scope) => Violation[]
		}

		type Pattern = string | RegExp | ((name: string, scope: Scope) => boolean)
		type Arg<T> = T | ((scope: Scope) => T)
		type Kind = 'folder' | 'file'
		type SyntaxNode = Span & { type: string }

		type Rules = (lift: Conventions) => Check[]

		interface Scope {
			readonly dir: string
			readonly name: string
			readonly pascal: string
			readonly parent: Scope | null
			readonly focus: readonly string[] | null
			path(...parts: string[]): string
			child(name: string): Scope
			inFocus(path: string): boolean
			entries(...parts: string[]): Dirent[]
			has(...parts: string[]): boolean
			read(file: string): string | null
			astro(file: string): AstroFile | null
			ts(file: string): Script | null
			script(file: string): Script | null | undefined
			scss(file: string): Root | null
		}

		interface Script {
			readonly file: string
			readonly source: string
			readonly program: Program
			readonly errors: string[]
			text(node: Span): string
			line(node?: Span): number
			find<T extends SyntaxNode>(type: T['type'], where?: (node: T) => boolean): T[]
		}

		interface AstroFile {
			readonly path: string
			readonly source: string
			readonly ast: RootNode
			readonly errors: string[]
			readonly frontmatter: Script | null
			readonly roots: Node[]
			readonly root: TagLikeNode | null
			elements(name: string): ElementNode[]
			content(node: ElementNode): { value: string; line: number }
			script(node: ElementNode): Script
		}

		type Entry = {
			key: string | null
			local: string | null
			node: ObjectExpression['properties'][number]
		}

		type Ast = {
			propsPattern(script: Script): ObjectPattern | null
			propsKeys(script: Script): Set<string>
			restName(script: Script): string | null
			declarator(script: Script, name: string): VariableDeclarator
			declared(script: Script, name: string): string | null
			inlined(script: Script, name: string): string | null
			refName(ref: TSTypeReference): string | null
			typeReferences(script: Script, type: string): TSTypeReference[]
			objectEntries(object: ObjectExpression): Entry[]
			exportedConst(script: Script, name: string): VariableDeclarator | null
			exportedClass(script: Script, name: string): Class | null
			superName(found: Class | null): string | null
			importOf(
				script: Script,
				local: string | null,
			): { source: string; imported: string } | undefined
			booleanOf(value: Expression | null | undefined): boolean | null
		}

		type Conventions = {
			conventions(...checks: Check[]): Check[]
			check(
				id: string,
				description: string,
				run: (scope: Scope) => Violation[],
			): Check
			each(pattern: Pattern, ...checks: Check[]): Check
			when(predicate: (scope: Scope) => boolean, ...checks: Check[]): Check
			unless(predicate: (scope: Scope) => boolean, ...checks: Check[]): Check
			preset(name: string, build: () => Check[]): Check
			allowedItems(kind: Kind, patterns: Arg<readonly Pattern[]>): Check
			requiredItems(kind: Kind, names: Arg<readonly string[]>): Check
			declares(file: Arg<string>, name: string, value: Arg<string | RegExp>): Check
			declaresType(file: Arg<string>, name: string): Check
			typeIncludes(
				file: Arg<string>,
				type: string,
				reference: Arg<string | RegExp>,
			): Check
			reexports(file: Arg<string>, name: string, from: Arg<string>): Check
			imports(file: Arg<string>, from: Arg<string>): Check
			endsWith(file: Arg<string>, statement: Arg<string>): Check
			extendsClass(
				file: Arg<string>,
				name: Arg<string>,
				base: Arg<string | RegExp>,
				options?: { via?: (parent: string, scope: Scope) => string | null },
			): Check
			parses(file: Arg<string>): Check
			singleRoot(file: Arg<string>): Check
			rootTag(file: Arg<string>, patterns: Arg<readonly Pattern[]>): Check
			rootSpreads(file: Arg<string>, pattern: Arg<string | RegExp>): Check
			rootClassList(file: Arg<string>, items: Arg<readonly string[]>): Check
			rootWithout(file: Arg<string>, attributes: readonly string[]): Check
			attribute(node: TagLikeNode, name: string): AttributeNode | undefined
			spreads(node: TagLikeNode): string[]
			parseExpression(
				code: string,
			): { script: Script; expression: Expression } | null
			squash(code: string): string
			toPascal(name: string): string
			violation(
				rule: string,
				file: string,
				message: string,
				line?: number,
			): Violation
			Script: new (file: string, source: string) => Script
			ast: Ast
		}
	}
}

export {}

import { existsSync, readdirSync } from 'node:fs'
import { basename, dirname, join, relative, sep } from 'node:path'
import type { ExportNamedDeclaration } from 'oxc-parser'
import { lift } from './lift.ts'
import { conventionsEntry, conventionsFolder } from './names.ts'
import { isWithin, src } from './sources.ts'
import { allUses } from './uses.ts'

const shown = (path: string) => relative(src, path).split(sep).join('/')

const isConventionFile = (file: string) => file.split(sep).includes(conventionsFolder)

const ownerOf = (file: string) => {
	const parts = file.split(sep)
	const at = parts.lastIndexOf(conventionsFolder)
	return at === -1 ? dirname(file) : parts.slice(0, at).join(sep)
}

const ownFiles = (scope: Lift.Scope) =>
	existsSync(scope.path(conventionsFolder))
		? readdirSync(scope.path(conventionsFolder))
				.filter(name => name.endsWith('.ts'))
				.map(name => scope.path(conventionsFolder, name))
		: []

function exportedNames(node: ExportNamedDeclaration): string[] {
	const declaration = node.declaration
	if (!declaration) {
		return node.specifiers.flatMap(item =>
			item.exported.type === 'Identifier' ? [item.exported.name] : [],
		)
	}
	if (declaration.type === 'VariableDeclaration') {
		return declaration.declarations.flatMap(item => {
			if (item.id.type === 'Identifier') {
				return [item.id.name]
			}
			return item.id.type === 'ArrayPattern'
				? item.id.elements.flatMap(element => {
						const id =
							element?.type === 'AssignmentPattern' ? element.left : element
						return id?.type === 'Identifier' ? [id.name] : []
					})
				: []
		})
	}
	return 'id' in declaration && declaration.id?.type === 'Identifier'
		? [declaration.id.name]
		: []
}

export function conventionsIndex(scope: Lift.Scope): Lift.Violation[] {
	const file = scope.path(conventionsFolder, conventionsEntry)
	const script = scope.ts(join(conventionsFolder, conventionsEntry))
	const named = (script?.find<ExportNamedDeclaration>('ExportNamedDeclaration') ?? [])
		.flatMap(exportedNames)
		.map(name =>
			lift.violation(
				'conventionsIndex',
				file,
				`\`${name}\` is exported from ${conventionsEntry}; put it in another file of \`${conventionsFolder}\``,
			),
		)
	const imported = allUses()
		.filter(use => use.target === file)
		.map(use =>
			lift.violation(
				'conventionsIndex',
				use.file,
				`imports ${shown(file)}, which only holds the rules of its folder`,
			),
		)
	return [...named, ...imported]
}

export function conventionImports(scope: Lift.Scope): Lift.Violation[] {
	const own = new Set(ownFiles(scope))
	return allUses()
		.filter(use => own.has(use.file) && isConventionFile(use.target))
		.filter(use => !isWithin(ownerOf(use.target), scope.dir))
		.map(use =>
			lift.violation(
				'conventionImports',
				use.file,
				`\`${shown(use.target)}\` is not in this folder or above it; conventions import only from their own \`${conventionsFolder}\` and the ones above`,
			),
		)
}

const common = (dirs: string[]) =>
	dirs.reduce((a, b) => {
		const left = a.split(sep)
		const right = b.split(sep)
		let at = 0
		while (at < left.length && left[at] === right[at]) {
			at++
		}
		return left.slice(0, at).join(sep)
	})

function placement(scope: Lift.Scope, file: string, name: string): Lift.Violation[] {
	const users = allUses().filter(
		use =>
			use.target === file &&
			use.file !== file &&
			(use.names.includes(name) || use.names.includes('*')),
	)
	if (users.length === 0) {
		return [
			lift.violation(
				'definitionPlacement',
				file,
				`\`${name}\` is exported but nothing imports it`,
			),
		]
	}
	const owners = users.map(use => ownerOf(use.file)).filter(dir => isWithin(src, dir))
	const best = owners.length > 0 ? common(owners) : scope.dir
	return best !== scope.dir && isWithin(scope.dir, best)
		? [
				lift.violation(
					'definitionPlacement',
					file,
					`\`${name}\` is only used under ${shown(best)}; move it to its \`${conventionsFolder}\``,
				),
			]
		: []
}

export function definitionPlacement(scope: Lift.Scope): Lift.Violation[] {
	return ownFiles(scope)
		.filter(file => basename(file) !== conventionsEntry)
		.flatMap(file => {
			const script = scope.ts(relative(scope.dir, file))
			return (script?.find<ExportNamedDeclaration>('ExportNamedDeclaration') ?? [])
				.flatMap(exportedNames)
				.flatMap(name => placement(scope, file, name))
		})
}

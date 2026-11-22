import { lift } from '@/_conventions/lift.ts'
import { family, rule } from '@/_conventions/rules.ts'
import {
	astroFile,
	requiredRootFiles,
	rootFiles,
	uiAstroFile,
} from '@/components/_conventions/names.ts'

const astroEntry = (scope: Lift.Scope) => `./${astroFile(scope)}`

const uiFiles = (scope: Lift.Scope) => [uiAstroFile(scope)]

function rootIsBlock(scope: Lift.Scope): Lift.Violation[] {
	const file = uiAstroFile(scope)
	const astro = scope.astro(file)
	const root = astro?.root
	if (!astro?.frontmatter || !root) {
		return []
	}
	return lift.ast
		.importOf(astro.frontmatter, root.name)
		?.source.match(/^@(blocks|primitives)\//)
		? []
		: [
				lift.violation(
					'presetRoot',
					scope.path(file),
					`the root \`<${root.name}>\` is not a block or primitive; a preset has no element of its own`,
				),
			]
}

function noStyles(scope: Lift.Scope): Lift.Violation[] {
	const file = uiAstroFile(scope)
	const astro = scope.astro(file)
	return (astro?.elements('style') ?? []).map(node =>
		lift.violation(
			'presetStyles',
			scope.path(file),
			'a preset has no styles; style the blocks it combines',
			astro?.content(node).line,
		),
	)
}

export const preset = family('preset', {
	requiredFiles: rule('the preset has `index.ts`; `README.md` is optional', () =>
		lift.requiredItems('file', requiredRootFiles),
	),
	allowedFiles: rule('the preset holds only `README.md` and `index.ts`', () =>
		lift.allowedItems('file', rootFiles),
	),
	requiredFolders: rule('the preset has a `ui` folder', () =>
		lift.requiredItems('folder', ['ui']),
	),
	allowedFolders: rule('the preset holds only `ui`', () =>
		lift.allowedItems('folder', ['ui']),
	),
	indexReexport: rule('`index.ts` re-exports `ui/<Name>.astro` as default', () =>
		lift.reexports('index.ts', 'default', astroEntry),
	),
})

export const presetUi = family('preset', {
	parses: rule('`ui/<Name>.astro` parses', () => lift.parses(uiAstroFile)),
	uiFiles: rule('`ui` holds only `<Name>.astro`', () =>
		lift.allowedItems('file', uiFiles),
	),
	uiFolders: rule('`ui` holds no folders', () => lift.allowedItems('folder', [])),
	singleRoot: rule('the template has exactly one root element', () =>
		lift.singleRoot(uiAstroFile),
	),
	root: rule('the template root is a block or primitive', () =>
		lift.check('presetRoot', 'check the preset root', rootIsBlock),
	),
	noStyles: rule('no `<style>`: a preset has no styles of its own', () =>
		lift.check('presetStyles', 'check for preset styles', noStyles),
	),
})

import { existsSync, readFileSync, rmSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import {
	copyTokens,
	namesOf,
	onlyBlueprint,
	onlyFolder,
} from '@/_commands/lib/blueprint.ts'
import { posix, toPath } from '@/_commands/lib/names.ts'
import { formatCode } from '@/_commands/lib/format.ts'
import { isKebab } from '@/components/_conventions/names.ts'
import { astroFrontmatter } from '@scripts/astro/frontmatter.ts'

const pagesDirs = ['src/pages', 'src/pages/_dev']

const uiFolder = '_ui'

function pageBlueprint(context: Lift.CommandContext) {
	return (
		onlyBlueprint(join(context.root, 'src/pages'), 'plain') ??
		context.fail('No page blueprint in src/pages/_blueprints/plain')
	)
}

export async function createPage(context: Lift.CommandContext) {
	const segments = toPath(context.args.name ?? '')
	const id = segments.at(-1)
	if (!id) {
		return context.fail('Page name must contain at least one letter or number.')
	}
	const dir = join(context.root, pagesDirs[context.flags.dev ? 1 : 0], ...segments)
	if (existsSync(join(dir, '_page.ts'))) {
		return context.fail(`Refusing to overwrite existing page: ${dir}`)
	}
	const from = pageBlueprint(context)
	await copyTokens(context, {
		from,
		to: dir,
		names: namesOf(id),
		only: file => !file.startsWith(`${uiFolder}/`),
	})
	context.log(`Created ${posix(context.root, dir)} from ${posix(context.root, from)}`)
}

export async function createPageComponent(context: Lift.CommandContext) {
	const page = toPath(context.args.page ?? '').join('/')
	const component = context.args.component ?? ''
	if (!page) {
		return context.fail('Page name must contain at least one letter or number.')
	}
	if (!isKebab(component)) {
		return context.fail('Use a kebab-case component name, such as intro-section.')
	}
	const pagesDir = pagesDirs.find(dir =>
		existsSync(join(context.root, dir, page, '_page.ts')),
	)
	if (!pagesDir) {
		return context.fail(`Page not found: ${page}`)
	}
	const from = onlyFolder(join(pageBlueprint(context), uiFolder))
	if (!from) {
		return context.fail(
			`No page component blueprint in the page blueprint's ${uiFolder}`,
		)
	}
	const names = { ...namesOf(component), kebab: component }
	const dir = join(context.root, pagesDir, page, uiFolder, names.kebab)
	const index = join(context.root, pagesDir, page, 'index.astro')
	const source = readFileSync(index, 'utf8')
	const next = await formatCode(context, index, appendSection(context, source, names))
	await copyTokens(context, { from, to: dir, names })
	await context.files.update(index, () => next)
	context.log(`Created ${posix(context.root, dir)} from ${posix(context.root, from)}`)
}

function appendSection(
	context: Lift.CommandContext,
	source: string,
	names: ReturnType<typeof namesOf>,
) {
	const frontmatter = astroFrontmatter(source)
	if (!frontmatter) {
		return context.fail('The page needs Astro frontmatter to import its section.')
	}
	const body = frontmatter.body
	const opening = /<Layout\b(?:"[^"]*"|'[^']*'|\{[^}]*\}|[^>"'])*>/.exec(body)
	if (!opening || (body.match(/<Layout\b/g) ?? []).length !== 1) {
		return context.fail('The page needs one Layout component to append its section.')
	}
	const tag = `<${names.pascal} />`
	let rendered: string
	if (opening[0].endsWith('/>')) {
		rendered = body.replace(
			opening[0],
			`${opening[0].slice(0, -2).trimEnd()}>\n\t${tag}\n</Layout>`,
		)
	} else if (body.includes('</Layout>')) {
		rendered = body.replace(/\s*<\/Layout>/, `\n\t${tag}\n</Layout>`)
	} else {
		return context.fail('The page Layout has no closing tag.')
	}
	const head = frontmatter.block.replace(
		/\r?\n---$/,
		`\nimport ${names.pascal} from './${uiFolder}/${names.kebab}/${names.pascal}.astro'\n---`,
	)
	return head + rendered
}

export function removePage(context: Lift.CommandContext) {
	const segments = toPath(context.args.name ?? '')
	if (!segments.length) {
		return context.fail('Page name must contain at least one letter or number.')
	}
	const pages = resolve(context.root, pagesDirs[context.flags.dev ? 1 : 0])
	const dir = resolve(pages, ...segments)
	const path = relative(pages, dir)
	if (
		!path ||
		path.startsWith('..') ||
		isAbsolute(path) ||
		!existsSync(join(dir, '_page.ts'))
	) {
		return context.fail(`Page not found: ${segments.join('/')}`)
	}
	rmSync(dir, { recursive: true })
	context.log(`Removed ${posix(context.root, dir)}`)
}

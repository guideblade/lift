import { lift } from '@/_conventions/lift.ts'
import { family, rule } from '@/_conventions/rules.ts'
import { breakpoints, queryMixins, uiAstroFile, uiComponentName } from './names.ts'
import {
	block,
	checkScssContainer,
	checkTemplateContainer,
	type Child,
	content,
	describe,
	header,
	isContainer,
	isInclude,
	nameRule,
	styleBlock,
} from './style-block.ts'

const query = new RegExp(`^(${queryMixins.join('|')})\\((\\w+)(,.*)?\\)$`)

function checkStyleTag(found: NonNullable<ReturnType<typeof styleBlock>>) {
	const { astro, style } = found
	const line = style.position?.start.line
	const lang = style.attributes.find(item => item.name === 'lang')?.value ?? ''
	const issues: Lift.Violation[] = []
	if (astro.elements('style').length > 1) {
		issues.push(
			lift.violation(
				'styleBoilerplate',
				astro.path,
				'only one <style> block is allowed',
				line,
			),
		)
	}
	if (lift.squash(lang) !== 'scss') {
		issues.push(
			lift.violation(
				'styleBoilerplate',
				astro.path,
				'style must be `<style lang="scss">`',
				line,
			),
		)
	}
	return issues
}

function checkBoilerplate(scope: Lift.Scope): Lift.Violation[] {
	const found = styleBlock(scope)
	if (!found) {
		const astro = scope.astro(uiAstroFile(scope))
		return astro
			? [
					lift.violation(
						'styleBoilerplate',
						astro.path,
						'missing `<style lang="scss">`',
					),
				]
			: []
	}
	const { astro, root, at } = found
	const issues = checkStyleTag(found)
	if (!root) {
		const message = `style does not parse: ${found.error}`
		return [...issues, lift.violation('styleBoilerplate', astro.path, message, at())]
	}
	const nodes = content(root.nodes)
	const mismatch = header(uiComponentName(scope), nodes)
	const node = nodes[mismatch?.index ?? 4]
	if (mismatch) {
		const message = `expected \`${mismatch.expected}\`, found \`${describe(node)}\``
		issues.push(lift.violation('styleBoilerplate', astro.path, message, at(node)))
	} else if (!nameRule(node)) {
		const message = '@layer must hold only `.#{$name} { $self: &; … }`'
		issues.push(lift.violation('styleBoilerplate', astro.path, message, at(node)))
	}
	return issues
}

function checkQuery(node: Child, index: number, mixins: Set<string>) {
	const match =
		node.type === 'atrule' && node.name === 'include'
			? lift.squash(node.params).match(query)
			: null
	const bp = breakpoints[index] ?? '…'
	if (!match || match[2] !== bp) {
		return `expected \`@include cq(${bp})\` or \`mq(${bp})\`, found \`${describe(node)}\``
	}
	mixins.add(match[1] ?? '')
	const inner = content(node.type === 'atrule' ? node.nodes : [])
	return inner.length === 1 && isInclude(inner[0], `${bp}($self)`)
		? null
		: `\`${describe(node)}\` must contain only \`@include ${bp}($self)\``
}

function checkQueries(scope: Lift.Scope): Lift.Violation[] {
	const found = block(scope)
	if (!found?.rule) {
		return []
	}
	const { astro, rule, at } = found
	const queries = content(rule.nodes)
		.slice(1)
		.filter(node => !isContainer(node))
	const mixins = new Set<string>()
	const issues = queries.flatMap((node, index) => {
		const message = checkQuery(node, index, mixins)
		return message
			? [lift.violation('styleQueries', astro.path, message, at(node))]
			: []
	})
	if (queries.length < breakpoints.length) {
		const message = `include one query per breakpoint: ${breakpoints.join(', ')}`
		issues.push(lift.violation('styleQueries', astro.path, message, at(rule)))
	}
	if (mixins.size > 1) {
		issues.push(
			lift.violation(
				'styleQueries',
				astro.path,
				'do not mix `cq` and `mq`',
				at(rule),
			),
		)
	}
	return issues
}

const checkLayer = (layer: string) => (scope: Lift.Scope) => {
	const found = block(scope)
	const actual = found?.layer
	if (!found || actual?.type !== 'atrule' || actual.params === layer) {
		return []
	}
	const message = `use \`@layer ${layer}\`, not \`@layer ${actual.params}\``
	return [lift.violation('styleLayer', found.astro.path, message, found.at(actual))]
}

const containerAbout =
	'`@include is-container` appears only directly inside `.#{$name}` in the .astro style block'

export const style = family('style', {
	boilerplate: rule(
		"one `<style lang=\"scss\">`: @use tools, @use './<name>.scss', @use 'block:name' as block, `$name: block.$name`, then `@layer … { .#{$name} { $self: &; … } }`",
		() =>
			lift.check(
				'styleBoilerplate',
				'check Astro style boilerplate',
				checkBoilerplate,
			),
	),
	queries: rule(
		'inside `.#{$name}`: one `cq()` or `mq()` include per breakpoint, each holding only `@include <bp>($self)`; cq and mq never mixed',
		() => lift.check('styleQueries', 'check Astro style queries', checkQueries),
	),
	container: rule(containerAbout, () => scope => [
		...checkTemplateContainer(scope),
		...checkScssContainer(scope),
	]),
	layer: rule(
		'the style block uses the `@layer` of its component layer',
		(layer: string) =>
			lift.check('styleLayer', 'check Astro style layer', checkLayer(layer)),
	),
})

export const variantStyle = family('style', {
	container: rule(containerAbout, () => checkScssContainer),
})

import { isAbsolute, join, relative, sep } from 'node:path'
import { lift } from './lift.ts'
import { importsOf, src, targetOf } from './sources.ts'

const services = 'services'
const alias = '@services/'
const scheme = 'service:'

function serviceOf(root: string, path: string) {
	const rel = relative(join(root, services), path)
	if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) {
		return null
	}
	const [folder = '', ...rest] = rel.split(sep)
	const isFolder = rest.length > 0 || !folder.includes('.')
	return isFolder && !folder.startsWith('_') ? folder : null
}

const nameOf = (value: string, target: string | null, root: string) => {
	if (value.startsWith(alias)) {
		return value.slice(alias.length).split('/')[0] ?? ''
	}
	if (value.startsWith(scheme)) {
		return value.slice(scheme.length)
	}
	return target ? serviceOf(root, target) : null
}

const isProxy = (root: string, file: string) =>
	!relative(join(root, services), file).includes(sep)

export const serviceImports = (scope: Lift.Scope): Lift.Violation[] =>
	importsOf(scope).flatMap(({ file, value, line }) => {
		const name = nameOf(value, targetOf(file, value), src)
		const own = serviceOf(src, file)
		return name && name !== own && !isProxy(src, file)
			? [
					lift.violation(
						'serviceImports',
						file,
						`\`${value}\` is the ${name} service; import \`@services\` or use \`services:proxy\` in Sass`,
						line,
					),
				]
			: []
	})

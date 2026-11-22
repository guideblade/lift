export type InstanceKind = 'instance' | 'manager'

function cleanStem(pathOrFile: string): string {
	const file = pathOrFile.split(/[/\\]/).pop() ?? ''
	return file.split('?')[0].replace(/\.[^.]+$/, '')
}

function extractStem(source: string | URL | Function): string {
	if (typeof source === 'function') {
		const moduleId =
			'moduleId' in source && typeof source.moduleId === 'string'
				? source.moduleId
				: ''
		return moduleId ? cleanStem(moduleId) : (source.name ?? '')
	}
	if (source instanceof URL) {
		return cleanStem(source.pathname)
	}
	if (typeof source === 'string') {
		return cleanStem(source)
	}
	return ''
}

function toPascalCase(name: string): string {
	if (name.includes('-') || name === name.toLowerCase()) {
		return name
			.split('-')
			.map(part => part.charAt(0).toUpperCase() + part.slice(1))
			.join('')
	}
	return name
}

export function deriveInstanceName(
	source: string | URL | Function,
	kind: InstanceKind,
): string {
	const stem = extractStem(source)
	const expectedPrefix = kind === 'instance' ? 'Instance' : 'Manager'

	if (!stem || !stem.startsWith(expectedPrefix)) {
		throw new Error(
			`deriveInstanceName: ${kind} file/class name must start with "${expectedPrefix}", received "${stem}".`,
		)
	}

	const rawName = stem.slice(expectedPrefix.length)
	if (!rawName) {
		throw new Error(
			`deriveInstanceName: ${kind} file/class name must include a name after "${expectedPrefix}", received "${stem}".`,
		)
	}

	return toPascalCase(rawName)
}

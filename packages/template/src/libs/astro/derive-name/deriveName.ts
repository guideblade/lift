export interface ComponentModule {
	(...args: never[]): unknown
	moduleId?: string | undefined
}

export function deriveName(source: string | ComponentModule): string {
	if (typeof source === 'string') {
		return source
	}

	const moduleId = source?.moduleId

	if (!moduleId) {
		throw new Error(
			'deriveName: component has no moduleId — pass the name explicitly as a string.',
		)
	}

	const file = moduleId.split(/[/\\]/).pop() ?? ''
	const stem = file.split('?')[0].replace(/\.[^.]+$/, '')

	return stem.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

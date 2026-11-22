export function escapeClassName(name: string): string {
	return name.replace(/[^\w-]/g, char => `\\${char}`)
}

export function classSelector(...names: string[]): string {
	return names
		.flatMap(name => name.split(/\s+/))
		.filter(Boolean)
		.map(name => `.${escapeClassName(name)}`)
		.join('')
}

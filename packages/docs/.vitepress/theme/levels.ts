export type Kind = 'skill' | 'brief'

export type Level = {
	kind: Kind
	name: string
	folder: string
	url: string
	title: string
	description: string
	html: string
}

export const kinds = [
	{ kind: 'skill', label: 'Skills', folder: '_skills', file: 'SKILL.md' },
	{ kind: 'brief', label: 'Briefs', folder: '_briefs', file: 'BRIEF.md' },
] as const

const levelPath = /^(?:(.+)\/)?(_skills|_briefs)\/([^/]+)\/(SKILL|BRIEF)\.md$/

export function levelOf(path: string) {
	const match = path.replace(/\\/g, '/').match(levelPath)
	const kind = kinds.find(
		known => known.folder === match?.[2] && known.file === `${match?.[4]}.md`,
	)
	return match && kind
		? { kind: kind.kind, name: match[3], folder: match[1] ?? '' }
		: null
}

export const folderOf = (path: string) =>
	path.replace(/\\/g, '/').replace(/\/?[^/]*$/, '')

export const contains = (outer: string, inner: string) =>
	outer === '' || inner === outer || inner.startsWith(`${outer}/`)

const depth = (level: Pick<Level, 'folder'>) =>
	level.folder === '' ? 0 : level.folder.split('/').length

export const byDepth = <T extends Pick<Level, 'folder'>>(a: T, b: T) =>
	depth(a) - depth(b) || a.folder.localeCompare(b.folder)

type Named = Pick<Level, 'kind' | 'name' | 'folder'>

export const sameItem = (a: Named, b: Named) => a.kind === b.kind && a.name === b.name

export const isTop = <T extends Named>(level: T, levels: readonly T[]) =>
	!levels.some(
		other =>
			sameItem(other, level) &&
			other.folder !== level.folder &&
			contains(other.folder, level.folder),
	)

export const above = (levels: readonly Level[], folder: string) =>
	levels.filter(level => contains(level.folder, folder)).sort(byDepth)

export const below = (levels: readonly Level[], folder: string) =>
	levels
		.filter(level => level.folder !== folder && contains(folder, level.folder))
		.sort(byDepth)

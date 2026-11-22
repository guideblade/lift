export type Kind = {
	noun: string
	topic: string
	folder: string
	file: string
}

export const skills: Kind = {
	noun: 'skill',
	topic: 'skills',
	folder: '_skills',
	file: 'SKILL.md',
}

export const briefs: Kind = {
	noun: 'brief',
	topic: 'briefs',
	folder: '_briefs',
	file: 'BRIEF.md',
}

export const kinds = [skills, briefs]

export const kindFolders = kinds.map(kind => kind.folder)

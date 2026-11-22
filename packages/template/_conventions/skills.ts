import { isMap, isScalar, parseDocument } from 'yaml'

const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/

const validReview = (value: unknown) => {
	if (value === null) {
		return true
	}
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return false
	}
	const date = new Date(`${value}T00:00:00.000Z`)
	return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function hasValidReview(metadata: unknown) {
	const reviewed = isMap(metadata) ? metadata.get('reviewed', true) : undefined
	return isScalar(reviewed) && validReview(reviewed.value)
}

function fields(source: string, name: string) {
	const match = source.match(frontmatter)
	if (!match) {
		return ['SKILL.md needs YAML frontmatter']
	}
	const document = parseDocument(match[1])
	if (document.errors.length || !isMap(document.contents)) {
		return ['SKILL.md needs valid YAML frontmatter']
	}
	const description: unknown = document.get('description')
	const unknown = document.contents.items
		.map(item => String(item.key))
		.filter(key => !['name', 'description', 'metadata'].includes(key))
	return [
		...unknown.map(key => `Unknown frontmatter field: ${key}`),
		...(document.get('name') === name
			? []
			: [`Set name to ${name} to match the skill folder`]),
		...(typeof description === 'string' && description.trim()
			? []
			: ['Add a nonempty description']),
		...(hasValidReview(document.get('metadata', true))
			? []
			: ['Set metadata.reviewed to a valid YYYY-MM-DD date or null']),
		...(source.slice(match[0].length).trim() ? [] : ['Add a nonempty skill body']),
	]
}

export const skillFolders: Lift.Rules = api => [
	api.check('skills.name', 'Skill names start with an -ing word', scope =>
		scope
			.entries()
			.filter(
				entry =>
					entry.isDirectory() && !entry.name.split('-')[0]?.endsWith('ing'),
			)
			.map(entry =>
				api.violation(
					'skills.name',
					scope.path(entry.name),
					'Start the skill name with a word ending in ing',
				),
			),
	),
]

export const skillPiece: Lift.Rules = api => [
	api.check(
		'skills.file',
		'Each skill piece has a name, description, review status, and body',
		scope => {
			const file = 'SKILL.md'
			const source = scope.read(file)
			const issues = source === null ? ['Add SKILL.md'] : fields(source, scope.name)
			return issues.map(message =>
				api.violation('skills.file', scope.path(file), message),
			)
		},
	),
]

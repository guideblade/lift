const scope = 'src/assets/(image)'

const names = [
	'image-hero',
	'image-showcase',
] as const

export interface PhotoScopes {
	'src/assets/(image)': (typeof names)[number]
}

export type PhotoName = PhotoScopes[typeof scope]

export default scope

export const IMAGE_DIR = 'src/assets/(image)'
export const GLOBAL_REGISTRY = 'src/components/blocks/photo/_generated/photos.ts'
export const CACHE_DIR = '.cache/photo'
export const LOCAL_FOLDER = ['media', 'photos'] as const
export const REGISTRY_FILE = '_generated/photos.ts'
export const BARREL_FILE = 'index.ts'
export const SCOPES_MODULE = '@blocks/photo/_generated/photos.ts'

export const SOURCE_FORMATS = ['jpg', 'png'] as const
export const GENERATED_FORMATS = ['avif', 'webp'] as const
export const SOURCE_SCALES = [100, 200] as const
export const GENERATED_SCALES = [50, 75, 100, 125, 150, 200] as const
export const GENERATED_WIDTHS = [640, 828, 1080, 1280, 1600, 1920] as const

export const ENCODERS = {
	avif: { quality: 50 },
	webp: { quality: 80 },
} as const

export type SourceFormat = (typeof SOURCE_FORMATS)[number]
export type GeneratedFormat = (typeof GENERATED_FORMATS)[number]
export type SourceScale = (typeof SOURCE_SCALES)[number]

export interface ParsedImage {
	name: string
	phase: string
	scale: number
	extension: string
}

export function parseImageFilename(
	filename: string,
	options: {
		phases: readonly string[]
		extensions: readonly string[]
		scales: readonly number[]
	},
): ParsedImage {
	const extMatch = filename.match(/\.([^.@]+)$/)
	if (!extMatch) {
		throw new Error(`[Photo] File "${filename}" is invalid: missing file extension.`)
	}

	const extension = extMatch[1]
	if (!options.extensions.includes(extension)) {
		throw new Error(
			`[Photo] File "${filename}" has forbidden extension ".${extension}". Allowed: ${options.extensions.map(e => `.${e}`).join(', ')}.`,
		)
	}

	const parts = filename.slice(0, -(extension.length + 1)).split('@')
	if (parts.length !== 3) {
		throw new Error(
			`[Photo] File "${filename}" is invalid: must follow pattern image-<name>@<screen>@<scale>.${extension} (e.g. image-hero@large@200.${extension}).`,
		)
	}

	const [name, phase, rawScale] = parts

	if (!/^image-[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
		throw new Error(
			`[Photo] File "${filename}" is invalid: name "${name}" must start with "image-" and contain only lowercase letters, digits and single dashes.`,
		)
	}

	if (!options.phases.includes(phase)) {
		throw new Error(
			`[Photo] File "${filename}" has unknown screen "@${phase}". Allowed screens: ${options.phases.map(p => `@${p}`).join(', ')}.`,
		)
	}

	const scale = Number(rawScale)
	if (!/^\d+$/.test(rawScale) || !options.scales.includes(scale)) {
		throw new Error(
			`[Photo] File "${filename}" has invalid scale "@${rawScale}". Allowed scales: ${options.scales.map(s => `@${s}`).join(', ')}.`,
		)
	}

	return { name, phase, scale, extension }
}

export function generatedScalesFor(scales: readonly number[]) {
	const max = Math.max(...scales)
	return GENERATED_SCALES.filter(scale => scale <= max)
}

export function generatedWidthsFor(max: number) {
	return GENERATED_WIDTHS.filter(width => width < max)
}

export interface PhaseCandidate {
	src: string
	width: number
}

export interface PhaseSet {
	fallback: ImageMetadata
	width: number
	height: number
	candidates: Record<GeneratedFormat, PhaseCandidate[]>
}

export type PhotoSets = Record<string, Record<string, Record<string, PhaseSet>>>

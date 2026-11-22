import { createHash } from 'node:crypto'
import { readdir, readFile, rename } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'
import {
	BARREL_FILE,
	ENCODERS,
	GENERATED_FORMATS,
	SOURCE_FORMATS,
	SOURCE_SCALES,
	generatedScalesFor,
	generatedWidthsFor,
	parseImageFilename,
	type GeneratedFormat,
	type SourceScale,
} from './photoValidator.ts'

const SETTINGS = JSON.stringify({ formats: GENERATED_FORMATS, encoders: ENCODERS })

export interface SourceFile {
	file: string
	extension: string
	width: number
	height: number
}

export interface Group {
	name: string
	phase: string
	sources: Partial<Record<SourceScale, SourceFile>>
}

export interface Output {
	file: string
	format: GeneratedFormat
	width: number
}

export interface PhaseModel {
	name: string
	phase: string
	fallback: string
	width: number
	height: number
	outputs: Output[]
}

async function addSource(
	groups: Map<string, Group>,
	imageDir: string,
	file: string,
	phases: string[],
) {
	const { name, phase, scale, extension } = parseImageFilename(file, {
		phases,
		extensions: SOURCE_FORMATS,
		scales: SOURCE_SCALES,
	})
	const key = `${name}@${phase}`
	const group = groups.get(key) ?? { name, phase, sources: {} }
	groups.set(key, group)

	const existing = group.sources[scale as SourceScale]
	if (existing) {
		throw new Error(
			`[Photo] "${file}" and "${existing.file}" both describe ${key} at scale @${scale}. Keep only one.`,
		)
	}

	const { width = 0, height = 0 } = await sharp(resolve(imageDir, file)).metadata()
	group.sources[scale as SourceScale] = { file, extension, width, height }
}

function validatePair(key: string, x1: SourceFile, x2: SourceFile) {
	if (x1.extension !== x2.extension) {
		throw new Error(
			`[Photo] ${key} mixes formats: "${x1.file}" and "${x2.file}". Use one format per image and screen.`,
		)
	}
	if (Math.abs(x2.width - x1.width * 2) > 2) {
		throw new Error(
			`[Photo] "${x2.file}" is ${x2.width}px wide, expected about ${x1.width * 2}px (2× "${x1.file}"). Re-export both from the same frame.`,
		)
	}
	if (Math.abs(x1.width / x1.height - x2.width / x2.height) > 0.01) {
		throw new Error(
			`[Photo] "${x1.file}" (${x1.width}×${x1.height}) and "${x2.file}" (${x2.width}×${x2.height}) have different aspect ratios. Re-export both from the same frame.`,
		)
	}
}

export async function collectGroups(imageDir: string, phases: string[]) {
	const entries = await readdir(imageDir, { withFileTypes: true })
	const groups = new Map<string, Group>()
	const ignored = new Set([BARREL_FILE])

	for (const entry of entries) {
		if (entry.isFile() && !entry.name.startsWith('.') && !ignored.has(entry.name)) {
			await addSource(groups, imageDir, entry.name, phases)
		}
	}

	for (const [key, { sources }] of groups) {
		if (sources[100] && sources[200]) {
			validatePair(key, sources[100], sources[200])
		}
	}

	return groups
}

async function sourceKey(path: string) {
	return createHash('sha256')
		.update(await readFile(path))
		.update(SETTINGS)
		.digest('hex')
		.slice(0, 16)
}

export async function planGroup(imageDir: string, group: Group) {
	const scales = generatedScalesFor(Object.keys(group.sources).map(Number))
	const keys: Partial<Record<SourceScale, string>> = {}
	for (const [scale, source] of Object.entries(group.sources)) {
		keys[Number(scale) as SourceScale] = await sourceKey(
			resolve(imageDir, source.file),
		)
	}

	const scaled = scales.map(scale => {
		const sourceScale: SourceScale = scale > 100 || !group.sources[100] ? 200 : 100
		const source = group.sources[sourceScale] as SourceFile
		return { sourceScale, width: Math.round((source.width * scale) / sourceScale) }
	})
	const smallestScaleWidth = Math.min(...scaled.map(({ width }) => width))
	const fixed = generatedWidthsFor(smallestScaleWidth).map(width => ({
		sourceScale: (group.sources[100] ? 100 : 200) as SourceScale,
		width,
	}))

	return [...fixed, ...scaled].flatMap(({ sourceScale, width }) => {
		const source = group.sources[sourceScale] as SourceFile
		return GENERATED_FORMATS.map(format => ({
			source: resolve(imageDir, source.file),
			output: { file: `${keys[sourceScale]}-${width}.${format}`, format, width },
		}))
	})
}

export async function renderGroup(
	imageDir: string,
	cacheDir: string,
	group: Group,
	cached: Set<string>,
): Promise<PhaseModel> {
	const plan = await planGroup(imageDir, group)
	const missing = plan.filter(({ output }) => !cached.has(output.file))

	if (missing.length && !group.sources[200]) {
		console.warn(
			`[Photo] ${group.name}@${group.phase} has no @200 source. High-density screens will get a soft image. Export it at 2× from Figma.`,
		)
	}

	await Promise.all(
		missing.map(async ({ source, output }) => {
			const target = resolve(cacheDir, output.file)
			const pipeline = sharp(source).resize({ width: output.width })
			const encoded =
				output.format === 'avif'
					? pipeline.avif(ENCODERS.avif)
					: pipeline.webp(ENCODERS.webp)
			await encoded.toFile(`${target}.tmp`)
			await rename(`${target}.tmp`, target)
			cached.add(output.file)
		}),
	)

	const fallbackScale = group.sources[100] ? 100 : 200
	const fallback = group.sources[fallbackScale] as SourceFile
	return {
		name: group.name,
		phase: group.phase,
		fallback: resolve(imageDir, fallback.file),
		width: Math.round((fallback.width * 100) / fallbackScale),
		height: Math.round((fallback.height * 100) / fallbackScale),
		outputs: plan.map(({ output }) => output),
	}
}

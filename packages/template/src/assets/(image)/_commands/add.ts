import { existsSync, readdirSync } from 'node:fs'
import { extname, join, relative, resolve, sep } from 'node:path'
import { config } from '@config'
import {
	IMAGE_DIR,
	LOCAL_FOLDER,
	parseImageFilename,
	SOURCE_FORMATS,
	SOURCE_SCALES,
} from '@blocks/photo/lib/photoValidator.ts'
import { posix, toKebab } from '@/_commands/lib/names.ts'

const screens = Object.keys(config.devices)

const extensionOf = (file: string) => {
	const extension = extname(file).slice(1).toLowerCase()
	return extension === 'jpeg' ? 'jpg' : extension
}

function imageFolder(context: Lift.CommandContext) {
	const to = context.flags.to
	if (typeof to !== 'string') {
		return join(context.root, IMAGE_DIR)
	}
	const dir = resolve(context.cwd, to)
	const local = relative(context.root, dir).split(sep).slice(-LOCAL_FOLDER.length)
	return local.join('/') === LOCAL_FOLDER.join('/')
		? dir
		: context.fail(
				`Photos go in ${IMAGE_DIR} or a ${LOCAL_FOLDER.join('/')} folder, not ${to}`,
			)
}

function validatePhoto(context: Lift.CommandContext, filename: string) {
	try {
		parseImageFilename(filename, {
			phases: screens,
			extensions: SOURCE_FORMATS,
			scales: SOURCE_SCALES,
		})
	} catch (error) {
		return context.fail(error instanceof Error ? error.message : String(error))
	}
}

async function addImage(context: Lift.CommandContext) {
	const { generators, sync } = await import('@/_commands/lib/sync.ts')
	const base = toKebab((context.args.name ?? '').replace(/^image-/, ''))
	if (!base) {
		return context.fail('The image name must contain at least one letter or number.')
	}
	const given = screens.filter(screen => context.args[screen])
	if (given.length === 0) {
		return context.fail(`Give a file for at least one screen: ${screens.join(', ')}`)
	}
	const scale = Number(context.flags.scale ?? SOURCE_SCALES.at(-1))
	const folder = imageFolder(context)
	const existing = existsSync(folder) ? readdirSync(folder) : []
	for (const screen of given) {
		const source = resolve(context.cwd, context.args[screen] ?? '')
		if (!existsSync(source)) {
			return context.fail(`No file at ${source}`)
		}
		const filename = `image-${base}@${screen}@${scale}.${extensionOf(source)}`
		validatePhoto(context, filename)
		const other = existing.find(
			file =>
				file.startsWith(`image-${base}@${screen}@`) &&
				extname(file) !== extname(filename),
		)
		if (other) {
			return context.fail(
				`${other} already holds ${screen}; an image keeps one format per screen`,
			)
		}
		const file = await context.files.copy(source, join(folder, filename))
		context.log(`Added ${posix(context.root, file)}`)
	}
	await sync(context, generators.photo)
}

export default {
	summary: 'Add a photo by the naming rules',
	description:
		'Copies one file per screen into src/assets/(image), or a media/photos folder with --to, as image-<name>@<screen>@<scale>, after the same checks the build runs. Export at 2x; --scale 100 for 1x files.',
	examples: [
		`hero ./hero-phone.jpg ./hero-tablet.jpg ./hero-desktop.jpg`,
		`card-cover ./cover.png --scale 100 --to src/components/widgets/hero/media/photos`,
	],
	args: [
		{ name: 'name', description: 'image name, without image-', required: true },
		...screens.map(screen => ({
			name: screen,
			description: `file for the ${screen} screen`,
		})),
	],
	flags: [
		{
			name: 'scale',
			type: 'string',
			description: 'source scale, 200 or 100 (default 200)',
		},
		{
			name: 'to',
			type: 'string',
			description: 'a media/photos folder instead of src/assets/(image)',
		},
	],
	run: addImage,
} satisfies Lift.Command

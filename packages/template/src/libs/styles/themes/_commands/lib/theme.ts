import { unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { formatCode } from '@/_commands/lib/format.ts'

function themePath(context: Lift.CommandContext) {
	const name = context.args.name ?? ''
	if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)) {
		return context.fail('Use a lowercase theme name such as ocean or high-contrast.')
	}
	if (name === 'mono') {
		return context.fail('Mono is the built-in theme.')
	}
	return `src/libs/styles/themes/${name}.scss`
}

export async function createTheme(context: Lift.CommandContext) {
	const file = themePath(context)
	const content = `@use 'block:name';
@use '../theme' as *;

@include theme(name.$name, ());
`
	await context.files.create(file, await formatCode(context, file, content))
	context.log(`Created ${file}`)
}

export async function removeTheme(context: Lift.CommandContext) {
	const file = themePath(context)
	await unlink(join(context.root, file))
	context.log(`Removed ${file}`)
}

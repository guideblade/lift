import { htmlTags } from '@/components/_conventions/names.ts'

export async function askInstance(context: Lift.CommandContext, name: string) {
	const { flags } = context
	if (htmlTags.has(name)) {
		if (flags.instance) {
			context.fail(
				`"${name}" is an HTML tag, so its component is plain. Build the enhanced control as a kit instance on a behavior from @behaviors instead.`,
			)
		}
		return false
	}
	if (flags.instance) {
		return true
	}
	if (flags.plain || !context.interactive) {
		return false
	}
	const answer = await context.ask(
		'Is this an instance (custom element with a manager)? [y/N]',
	)
	return /^y(es)?$/i.test(answer)
}

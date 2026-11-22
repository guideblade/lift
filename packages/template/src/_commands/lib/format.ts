import { format } from 'oxfmt'
import options from '../../../oxfmt.config.ts'

export async function formatCode(
	context: Lift.CommandContext,
	file: string,
	content: string,
) {
	const result = await format(file, content, options)
	if (result.errors.length) {
		return context.fail(
			`Cannot format ${file}: ${result.errors.map(error => error.message).join('; ')}`,
		)
	}
	return result.code
}

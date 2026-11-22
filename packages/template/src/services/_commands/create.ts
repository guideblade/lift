import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { copyTokens, onlyBlueprint } from '@/_commands/lib/blueprint.ts'
import { posix, toCamel, toKebab, toPascal } from '@/_commands/lib/names.ts'

async function createService(context: Lift.CommandContext) {
	const pascal = toPascal(context.args.name ?? '')
	if (!pascal) {
		return context.fail(
			'The service name must contain at least one letter or number.',
		)
	}
	const names = { pascal, kebab: toKebab(pascal), camel: toCamel(pascal) }
	const services = join(context.root, 'src/services')
	const dir = join(services, names.kebab)
	if (existsSync(dir)) {
		return context.fail(`A service named ${pascal} already exists at ${dir}`)
	}
	const from = onlyBlueprint(services, 'plain')
	if (!from) {
		return context.fail('No service blueprint in src/services/_blueprints/plain')
	}
	await copyTokens(context, { from, to: dir, names })
	context.log(`Created ${posix(context.root, dir)} from ${posix(context.root, from)}`)
	context.log(
		`It starts with every page, is reached as services.${names.camel} from @services, and stays off until config.services.${names.camel} has enabled: true`,
	)
}

export default {
	summary: 'Create a service in src/services',
	description:
		'Copies src/services/_blueprints/plain under the new name. The @services proxy finds it, so the layout starts it with the others and everything reaches it through the proxy; it stays off until config.services has its settings.',
	examples: ['Parallax'],
	args: [{ name: 'name', description: 'ServiceName', required: true }],
	run: createService,
} satisfies Lift.Command

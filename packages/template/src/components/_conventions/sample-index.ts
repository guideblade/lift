import { lift } from '@/_conventions/lift.ts'
import { primarySample, sampleExport, samplesExport, samplesFile } from './names.ts'

const folders = (scope: Lift.Scope) =>
	scope
		.entries()
		.filter(entry => entry.isDirectory())
		.map(entry => entry.name)

function checkEntry(script: Lift.Script, entry: Lift.Entry, names: string[]) {
	const at = script.line(entry.node)
	if (entry.key === null || !names.includes(entry.key)) {
		return [
			lift.violation(
				'samplesIndex',
				script.file,
				`\`${entry.key}\` has no sample folder`,
				at,
			),
		]
	}
	const origin = lift.ast.importOf(script, entry.local)
	return origin?.source === `./${entry.key}` && origin.imported === sampleExport
		? []
		: [
				lift.violation(
					'samplesIndex',
					script.file,
					`\`${entry.key}\` must be \`import { ${sampleExport} as ${entry.key} } from './${entry.key}'\``,
					at,
				),
			]
}

export function checkSamplesIndex(scope: Lift.Scope): Lift.Violation[] {
	const script = scope.ts(samplesFile)
	if (!script) {
		return []
	}
	const init = lift.ast.exportedConst(script, samplesExport)?.init
	if (init?.type !== 'ObjectExpression') {
		const message = `missing \`export const ${samplesExport} = { … }\``
		return [lift.violation('samplesIndex', script.file, message, script.line())]
	}
	const names = folders(scope)
	const listed = lift.ast.objectEntries(init)
	const keys = listed.map(entry => entry.key)
	const at = script.line(init)
	const first =
		keys[0] === primarySample
			? []
			: [
					lift.violation(
						'samplesIndex',
						script.file,
						`\`${primarySample}\` must be listed first`,
						at,
					),
				]
	const unlisted = names
		.filter(name => !keys.includes(name))
		.map(name =>
			lift.violation(
				'samplesIndex',
				script.file,
				`sample folder \`${name}\` is not listed`,
				at,
			),
		)
	return [
		...first,
		...unlisted,
		...listed.flatMap(entry => checkEntry(script, entry, names)),
	]
}

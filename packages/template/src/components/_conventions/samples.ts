import { lift } from '@/_conventions/lift.ts'
import { family, rule } from '@/_conventions/rules.ts'
import { sampleSlotsKey } from '@/_conventions/names.ts'
import type { ObjectExpression } from 'oxc-parser'
import {
	defaultSlot,
	kebab,
	primarySample,
	sampleExport,
	sampleFile,
	samplesFile,
	slotSuffix,
} from './names.ts'
import { checkSamplesIndex } from './sample-index.ts'

const slotFile = new RegExp(
	`^(${defaultSlot}|${kebab.source.slice(1, -1)})${slotSuffix.replaceAll('.', '\\.')}$`,
)
const vueFile = new RegExp(`^${kebab.source.slice(1, -1)}\\.vue$`)

function sampleObject(script: Lift.Script) {
	const init = lift.ast.exportedConst(script, sampleExport)?.init
	return init?.type === 'TSSatisfiesExpression' &&
		init.expression.type === 'ObjectExpression'
		? init.expression
		: null
}

function checkSample(scope: Lift.Scope): Lift.Violation[] {
	const script = scope.ts(sampleFile)
	return !script || sampleObject(script)
		? []
		: [
				lift.violation(
					'sampleObject',
					script.file,
					`missing \`export const ${sampleExport} = { … } satisfies <Content>\``,
					script.line(),
				),
			]
}

function slotEntries(object: ObjectExpression) {
	const property = lift.ast
		.objectEntries(object)
		.find(entry => entry.key === sampleSlotsKey)
	const value = property?.node.type === 'Property' ? property.node.value : null
	return value?.type === 'ObjectExpression' ? lift.ast.objectEntries(value) : []
}

const slotFiles = (scope: Lift.Scope) =>
	scope
		.entries()
		.filter(entry => entry.isFile() && entry.name.endsWith(slotSuffix))
		.map(entry => entry.name.slice(0, -slotSuffix.length))

function checkSampleSlots(scope: Lift.Scope): Lift.Violation[] {
	const script = scope.ts(sampleFile)
	const object = script ? sampleObject(script) : null
	if (!script || !object) {
		return []
	}
	const slots = slotEntries(object)
	const mapped = slots.filter(
		entry =>
			entry.key !== null &&
			lift.ast.importOf(script, entry.local)?.source ===
				`./${entry.key}${slotSuffix}`,
	)
	const wrong = slots
		.filter(entry => !mapped.includes(entry))
		.map(entry =>
			lift.violation(
				'sampleSlots',
				script.file,
				`\`${sampleSlotsKey}.${entry.key}\` must be imported from './${entry.key}${slotSuffix}'`,
				script.line(entry.node),
			),
		)
	const unused = slotFiles(scope)
		.filter(slot => !mapped.some(entry => entry.key === slot))
		.map(slot =>
			lift.violation(
				'sampleSlots',
				scope.path(`${slot}${slotSuffix}`),
				`not used: import it in ${sampleFile} and set \`${sampleSlotsKey}.${slot}\``,
			),
		)
	return [...wrong, ...unused]
}

export const samples = family('samples', {
	requiredFiles: rule('`samples` has `index.ts`', () =>
		lift.requiredItems('file', [samplesFile]),
	),
	requiredFolders: rule('`samples` has a `primary` sample', () =>
		lift.requiredItems('folder', [primarySample]),
	),
	allowedFiles: rule('`samples` holds only `index.ts`', () =>
		lift.allowedItems('file', [samplesFile]),
	),
	allowedFolders: rule('sample folders are kebab-case', () =>
		lift.allowedItems('folder', [kebab]),
	),
	index: rule(
		"`samples/index.ts` exports `samples` listing every sample folder, `primary` first, each as `import { sample as <name> } from './<name>'`",
		() => lift.check('samplesIndex', 'samplesIndex', checkSamplesIndex),
	),
})

export const sample = family('samples', {
	sampleRequiredFiles: rule('each sample has `index.ts`', () =>
		lift.requiredItems('file', [sampleFile]),
	),
	sampleAllowedFiles: rule(
		'a sample holds only `index.ts`, `<slot>.slot.astro` and `.vue` files',
		() => lift.allowedItems('file', [sampleFile, slotFile, vueFile]),
	),
	sampleFolders: rule('a sample holds no folders', () =>
		lift.allowedItems('folder', []),
	),
	object: rule(
		'a sample’s `index.ts` has `export const sample = { … } satisfies <Content>`',
		() => lift.check('sampleObject', 'sampleObject', checkSample),
	),
	slots: rule(
		'every `<slot>.slot.astro` is imported and set as `sampleSlots.<slot>`, and every `sampleSlots` entry comes from its matching file',
		() => lift.check('sampleSlots', 'sampleSlots', checkSampleSlots),
	),
})

export type Target = Record<string, unknown>

export type Outcome = { ok: boolean; text: string; pending?: boolean }

const limit = 160

const isElement = (value: object): value is Element =>
	'nodeType' in value && value.nodeType === 1 && 'tagName' in value

function elementText(element: Element) {
	const classes = [...element.classList].slice(0, 2).map(name => `.${name}`)
	return `<${element.tagName.toLowerCase()}${classes.join('')}>`
}

const clip = (text: string) => (text.length > limit ? `${text.slice(0, limit)}…` : text)

function primitive(value: unknown) {
	if (value === undefined) {
		return 'undefined'
	}
	return typeof value === 'function'
		? 'ƒ()'
		: clip(JSON.stringify(value) ?? String(value))
}

function list(value: unknown[], depth: number) {
	if (depth || !value.length) {
		return `Array(${value.length})`
	}
	const items = value.slice(0, 3).map(item => format(item, depth + 1))
	const more = value.length > 3 ? ', …' : ''
	return `Array(${value.length}) [${items.join(', ')}${more}]`
}

export function format(value: unknown, depth = 0): string {
	if (value === null || typeof value !== 'object') {
		return primitive(value)
	}
	if (isElement(value)) {
		return elementText(value)
	}
	if (Array.isArray(value)) {
		return list(value, depth)
	}
	try {
		return clip(JSON.stringify(value))
	} catch {
		return value.constructor?.name ?? 'Object'
	}
}

export function readMember(target: Target | null, name: string): unknown {
	try {
		return target?.[name]
	} catch (error) {
		return error
	}
}

const thenable = (value: unknown): value is PromiseLike<unknown> =>
	typeof value === 'object' &&
	value !== null &&
	typeof (value as PromiseLike<unknown>).then === 'function'

export async function invoke(
	target: Target,
	name: string,
	args: unknown[],
	pending: () => void,
): Promise<Outcome> {
	try {
		const method = target[name]
		if (typeof method !== 'function') {
			return { ok: false, text: `${name} is not a function here` }
		}
		const result: unknown = method.apply(target, args)
		if (!thenable(result)) {
			return { ok: true, text: format(result) }
		}
		pending()
		return { ok: true, text: `resolved ${format(await result)}` }
	} catch (error) {
		return { ok: false, text: error instanceof Error ? error.message : format(error) }
	}
}

export function instancesIn(view: Window | null, name: string): Target[] {
	const found = view?.document.querySelectorAll(`[data-instance-name="${name}"]`)
	return found ? ([...found] as unknown as Target[]) : []
}

export function managerIn(view: Window | null, name: string): Target | null {
	const managers = (view as (Window & { managers?: Record<string, unknown> }) | null)
		?.managers
	const manager = managers?.[name]
	return typeof manager === 'object' && manager !== null ? (manager as Target) : null
}

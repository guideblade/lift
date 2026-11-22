declare const __ELEMENTS__: { prefix: string }

const elements = () => __ELEMENTS__

const TAG_PART = /^[a-z][a-z0-9-]*$/

export function elementTag(name: string): string {
	const { prefix } = elements()
	if (!TAG_PART.test(prefix) || !TAG_PART.test(name)) {
		throw new Error(
			`elementTag: prefix "${prefix}" and name "${name}" must be lowercase kebab-case starting with a letter.`,
		)
	}
	return `${prefix}-${name}`
}

export function defineElement(
	constructor: CustomElementConstructor & { instanceName: string },
): string {
	const tag = elementTag(
		constructor.instanceName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(),
	)
	if (typeof customElements === 'undefined') {
		return tag
	}
	const existing = customElements.get(tag)
	if (!existing) {
		customElements.define(tag, constructor)
	} else if (existing !== constructor) {
		console.warn(
			`[defineElement] <${tag}> is already defined; reload the page to apply the new definition.`,
		)
	}
	return tag
}

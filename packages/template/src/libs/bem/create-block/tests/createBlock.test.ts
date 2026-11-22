/** @reviewed 2026-11-19 */
import { describe, expect, it } from 'vitest'

import { type Bem, createBlock } from '../createBlock'

declare const __BEM__: Bem

describe('createBlock', () => {
	it('creates a block name', () => {
		expect(createBlock('button').block).toBe('button')
	})

	it('creates BEM element and modifier names', () => {
		const block = createBlock('button')

		expect(block.element('inner')).toBe(`button${__BEM__.element}inner`)
		expect(block.modifier('variant-primary')).toBe(
			`button${__BEM__.modifier}variant-primary`,
		)
	})
})

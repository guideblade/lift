/** @reviewed 2026-11-19 */
import { describe, expect, it } from 'vitest'
import { deriveName } from '../deriveName'

describe('deriveName', () => {
	it('returns a string source directly', () => {
		expect(deriveName('accordion')).toBe('accordion')
	})

	it('derives kebab-case name from Astro component moduleId', () => {
		const mockAstroSelf = Object.assign(() => {}, {
			moduleId: 'E:/DEVELOP/lift/src/ui/accordion/ui/Accordion.astro',
		})
		expect(deriveName(mockAstroSelf)).toBe('accordion')
	})

	it('handles PascalCase names into kebab-case', () => {
		const mockAstroSelf = Object.assign(() => {}, {
			moduleId: '/src/widgets/SandboxSection.astro',
		})
		expect(deriveName(mockAstroSelf)).toBe('sandbox-section')
	})

	it('throws if moduleId is missing', () => {
		const mockAstroSelf = () => {}
		expect(() => deriveName(mockAstroSelf)).toThrow()
	})
})

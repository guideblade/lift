/** @reviewed null */
import { describe, expect, it } from 'vitest'
import { deriveInstanceName } from '../deriveInstanceName'

describe('deriveInstanceName - instance', () => {
	it('derives PascalCase name from Instance-prefixed string, file, or class', () => {
		expect(deriveInstanceName('InstanceAccordion', 'instance')).toBe('Accordion')
		expect(deriveInstanceName('InstanceAccordion.ts', 'instance')).toBe('Accordion')
		expect(
			deriveInstanceName('/src/ui/accordion/InstanceAccordion.ts', 'instance'),
		).toBe('Accordion')

		class InstanceAccordion {}
		expect(deriveInstanceName(InstanceAccordion, 'instance')).toBe('Accordion')
	})

	it('converts lowercase name to PascalCase', () => {
		expect(deriveInstanceName('Instanceaccordion', 'instance')).toBe('Accordion')
		expect(deriveInstanceName('Instancesandbox-section', 'instance')).toBe(
			'SandboxSection',
		)
	})

	it('throws when instance source does not start with Instance', () => {
		expect(() => deriveInstanceName('Accordion', 'instance')).toThrow(
			/must start with "Instance"/,
		)
		expect(() => deriveInstanceName('ManagerAccordion', 'instance')).toThrow(
			/must start with "Instance"/,
		)
		expect(() => deriveInstanceName('AccordionInstance', 'instance')).toThrow(
			/must start with "Instance"/,
		)
	})

	it('throws when instance source has no name after Instance', () => {
		expect(() => deriveInstanceName('Instance', 'instance')).toThrow(
			/must include a name after "Instance"/,
		)
	})
})

describe('deriveInstanceName - manager', () => {
	it('derives PascalCase name from Manager-prefixed string, file, or class', () => {
		expect(deriveInstanceName('ManagerAccordion', 'manager')).toBe('Accordion')
		expect(deriveInstanceName('ManagerAccordion.ts', 'manager')).toBe('Accordion')
		expect(
			deriveInstanceName('/src/ui/accordion/ManagerAccordion.ts', 'manager'),
		).toBe('Accordion')

		class ManagerAccordion {}
		expect(deriveInstanceName(ManagerAccordion, 'manager')).toBe('Accordion')
	})

	it('throws when manager source does not start with Manager', () => {
		expect(() => deriveInstanceName('Accordion', 'manager')).toThrow(
			/must start with "Manager"/,
		)
		expect(() => deriveInstanceName('InstanceAccordion', 'manager')).toThrow(
			/must start with "Manager"/,
		)
		expect(() => deriveInstanceName('AccordionManager', 'manager')).toThrow(
			/must start with "Manager"/,
		)
	})

	it('throws when manager source has no name after Manager', () => {
		expect(() => deriveInstanceName('Manager', 'manager')).toThrow(
			/must include a name after "Manager"/,
		)
	})
})

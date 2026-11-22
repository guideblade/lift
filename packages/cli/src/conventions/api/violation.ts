import { rel } from '../../project.ts'
import type { Violation } from '../types.ts'

export const violation = (
	rule: string,
	file: string,
	message: string,
	line?: number,
): Violation => ({ rule, file: rel(file), line, message })

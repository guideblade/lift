import type { Adapter } from './types.ts'
import * as v1 from './v1/index.ts'

export type { Adapter, ProjectConfig } from './types.ts'

export const adapters: Partial<Record<number, Adapter>> = { 1: v1 }

export const supported = { min: 1, max: 1 }

import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import { z } from 'zod'
import { getMode } from './base.ts'

const root = fileURLToPath(new URL('../..', import.meta.url))

const optional = <T extends z.ZodType>(schema: T) =>
	z.preprocess(value => (value === '' ? undefined : value), schema.optional())

const schema = z.object({
	PUBLIC_URL: optional(z.url({ protocol: /^https?$/ })),
	CI_PAGES_URL: optional(z.url({ protocol: /^https?$/ })),
	BASE_PATH: optional(z.string()),
	FAVICON_ENV: optional(z.enum(['development', 'preview', 'production'])),
	CI: optional(z.string()).transform(Boolean),
})

export type Env = z.infer<typeof schema>

export function getEnv(mode: string = getMode()): Env {
	const result = schema.safeParse({ ...loadEnv(mode, root, ''), ...process.env })
	if (!result.success) {
		throw new Error(
			`Invalid environment variables:\n${z.prettifyError(result.error)}`,
		)
	}

	return result.data
}

export function getSite(env: Env = getEnv()): string | undefined {
	return env.PUBLIC_URL ?? env.CI_PAGES_URL
}

export function getBase(env: Env = getEnv()): string | undefined {
	const base =
		env.BASE_PATH ??
		(env.CI_PAGES_URL ? new URL(env.CI_PAGES_URL).pathname : undefined)
	if (!base) {
		return undefined
	}

	return `/${base.replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/')
}

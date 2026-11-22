import { config, type ServiceSettings } from '@config'
import { BaseService } from '@libs/service'

type Module = Readonly<Record<string, unknown>>

type AttributeKey<M> = {
	[E in keyof M]: E extends `Service${string}Attribute` ? keyof M[E] & string : never
}[keyof M]

export interface Services {}

export interface ServiceTypes {}

export type ServiceName = keyof Services & keyof ServiceSettings & string

export type ServiceType<
	S extends keyof ServiceTypes,
	T extends keyof ServiceTypes[S],
> = ServiceTypes[S][T]

type ServiceClass = typeof BaseService & { getInstance(): BaseService }

const toCamel = (name: string) =>
	name.replace(/-([a-z0-9])/g, (_, letter: string) => letter.toUpperCase())

const modules: Readonly<Record<string, Module>> = Object.fromEntries(
	Object.entries(
		import.meta.glob<Module>(['./*/index.ts', '!./_*/index.ts'], { eager: true }),
	).map(([path, module]) => [toCamel(path.split('/')[1] ?? ''), module]),
)

export const services = modules as { readonly [S in keyof Services]?: Services[S] }

export function serviceOn(name: ServiceName): boolean {
	return (serviceSettings(name) as { enabled?: unknown } | undefined)?.enabled === true
}

export function serviceSettings<S extends ServiceName>(
	name: S,
): ServiceSettings[S] | undefined {
	return name in modules ? config.services[name] : undefined
}

const attributesOf = (module: Module | undefined) =>
	Object.entries(module ?? {}).find(([key]) =>
		/^Service\w+Attribute$/.test(key),
	)?.[1] as Readonly<Record<string, string>> | undefined

export function serviceAttributes<S extends ServiceName>(
	name: S,
	values: Partial<Record<AttributeKey<Services[S]>, string>>,
): Record<string, string> {
	const attributes = attributesOf(modules[name])
	return Object.fromEntries(
		Object.entries(values as Record<string, string | undefined>).flatMap(
			([key, value]) => {
				const attribute = attributes?.[key]
				return attribute && value !== undefined ? [[attribute, value]] : []
			},
		),
	)
}

const isService = (value: unknown): value is ServiceClass =>
	typeof value === 'function' && value.prototype instanceof BaseService

export function startServices(): void {
	for (const module of Object.values(modules)) {
		Object.values(module)
			.filter(isService)
			.forEach(service => service.getInstance())
	}
}

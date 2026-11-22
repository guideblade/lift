export abstract class BaseService {
	public static readonly serviceName: string

	protected onInit(): void {}

	public static getInstance<T extends BaseService>(
		this: (new () => T) & { serviceName: string },
	): T {
		const services = BaseService.registry()
		const existing = services[this.serviceName]
		if (existing instanceof this) {
			return existing
		}
		const service = new this()
		services[this.serviceName] = service
		service.onInit()
		return service
	}

	public static resetInstance(this: { serviceName: string }): void {
		delete BaseService.registry()[this.serviceName]
	}

	private static registry(): Record<string, unknown> {
		const globalScope = (typeof window !== 'undefined'
			? window
			: globalThis) as unknown as Window
		globalScope.services ??= {}
		return globalScope.services
	}
}

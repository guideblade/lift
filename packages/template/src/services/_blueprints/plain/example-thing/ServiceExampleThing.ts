import { config } from '@config'
import { BaseService } from '@libs/service'
import { ServiceExampleThingAttribute } from './lib/exampleThingAttribute'

export class ServiceExampleThing extends BaseService {
	public static override readonly serviceName = 'example-thing'

	public get enabled(): boolean {
		return config.services.exampleThing?.enabled === true
	}

	protected override onInit(): void {
		if (!this.enabled || typeof document === 'undefined') {
			return
		}
		document.documentElement.setAttribute(ServiceExampleThingAttribute.state, 'ready')
	}
}

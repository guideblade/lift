export {}

declare module '@config' {
	interface ServiceSettings {
		proximity: {
			enabled: boolean
			radius: number
			media: string
		}
	}
}

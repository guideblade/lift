declare global {
	interface Window {
		managers?: Record<string, unknown>
		services?: Record<string, unknown>
	}
}

export {}

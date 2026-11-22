export type PageStatus = 'draft' | 'ready' | 'paused' | 'deprecated'

export type PageConfig = {
	id: string
	status: PageStatus
	locales?: readonly string[]
	states?: readonly string[]
}

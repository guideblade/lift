export type ProjectConfig = Omit<Lift.Config, 'contract'>

export type Adapter = {
	types: string
	config: (raw: Lift.Config) => ProjectConfig
	conventions: Lift.Conventions
}

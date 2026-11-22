export const lift = {} as Lift.Conventions

export const provide = (api: Lift.Conventions) => Object.assign(lift, api)

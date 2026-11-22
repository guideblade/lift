import { join } from 'node:path'
import { lift, provide } from './lift.ts'
import { conventionsEntry, conventionsFolder } from './names.ts'

type Run = Lift.Check['run']
type Made = Lift.Check | Lift.Check[] | Run
type Definition<About extends string, A extends unknown[]> = {
	about: About
	make: (...args: A) => Made
}
type Definitions = Record<string, Definition<string, never[]>>

type Listed = {
	family: string
	name: string
	about: string
	on: boolean
	build: () => Lift.Check[]
}
type Rule<About extends string> = Listed & { about: About }
type Group = { family: string; names: readonly string[]; listed: Listed[] }

type Call<D> =
	D extends Definition<infer About, infer A>
		? ((...args: A) => Rule<About>) & { off: () => Rule<About> }
		: never

type Family<D extends Definitions> = ((...listed: Listed[]) => Group) & {
	[K in keyof D]: Call<D[K]>
}

const entry = join(conventionsFolder, conventionsEntry)

export const rule = <const About extends string, A extends unknown[] = []>(
	about: About,
	make: (...args: A) => Made,
): Definition<About, A> => ({ about, make })

export function family<D extends Definitions>(name: string, definitions: D): Family<D> {
	const listed = (
		key: string,
		about: string,
		on: boolean,
		make: () => Made,
	): Listed => ({
		family: name,
		name: key,
		about,
		on,
		build: () => {
			const made = make()
			return typeof made === 'function'
				? [lift.check(`${name}.${key}`, about, made)]
				: [made].flat()
		},
	})
	const calls = Object.fromEntries(
		Object.entries(definitions).map(([key, { about, make }]) => [
			key,
			Object.assign(
				(...args: never[]) => listed(key, about, true, () => make(...args)),
				{ off: () => listed(key, about, false, () => []) },
			),
		]),
	)
	const group = (...items: Listed[]): Group => ({
		family: name,
		names: Object.keys(definitions),
		listed: items,
	})
	return Object.assign(group, calls) as Family<D>
}

const counted = (names: string[]) =>
	names.reduce(
		(map, item) => map.set(item, (map.get(item) ?? 0) + 1),
		new Map<string, number>(),
	)

function listingIssues({ family: name, names, listed }: Group) {
	const foreign = listed
		.filter(item => item.family !== name)
		.map(item =>
			item?.family
				? `\`${item.family}.${item.name}\` is listed inside \`${name}(…)\``
				: `\`${name}(…)\` holds something that is not one of its rules`,
		)
	const own = listed.filter(item => item.family === name).map(item => item.name)
	const twice = [...counted(own)]
		.filter(([, count]) => count > 1)
		.map(([key]) => `\`${name}.${key}\` is listed more than once`)
	const missing = names
		.filter(key => !own.includes(key))
		.map(
			key =>
				`list \`${name}.${key}()\`, or \`${name}.${key}.off()\` to turn it off`,
		)
	return [...foreign, ...twice, ...missing]
}

const listing = (groups: Group[]): Lift.Check =>
	lift.check(
		'listing',
		'every family is listed once, with each of its rules once, on or off',
		scope => {
			const families = [...counted(groups.map(group => group.family))]
				.filter(([, count]) => count > 1)
				.map(([name]) => `\`${name}(…)\` is listed more than once`)
			return [...families, ...groups.flatMap(listingIssues)].map(message =>
				lift.violation('listing', scope.path(entry), message),
			)
		},
	)

function named({ family: group, name, about, on, build }: Listed): Lift.Check {
	const id = `${group}.${name}`
	if (!on) {
		return { id, description: `${id}: off — ${about}`, run: () => [] }
	}
	const checks = build()
	return {
		id,
		description: `${id}: ${about}`,
		inner: () => checks.filter(check => check.id !== id),
		run: scope =>
			checks
				.flatMap(check => check.run(scope))
				.map(item => ({ ...item, rule: id })),
	}
}

export const rules =
	(...groups: Group[]): Lift.Rules =>
	api => {
		provide(api)
		return lift.conventions(
			listing(groups),
			...groups.flatMap(group => group.listed.map(named)),
		)
	}

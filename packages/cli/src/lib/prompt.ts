import readline from 'node:readline'
import { createInterface } from 'node:readline/promises'

type State = {
	query: string
	selected: number
	start: number
	lines: number
}

const visible = 3

const deltas: Record<string, number> = { up: -1, down: 1 }

export const question = (text: string) => `\x1b[36m?\x1b[0m \x1b[1m${text}\x1b[0m `

export async function ask(text: string) {
	const prompt = createInterface({ input: process.stdin, output: process.stdout })
	const answer = await prompt.question(text)
	prompt.close()
	return answer.trim()
}

const filter = <T extends Lift.Choice>(items: readonly T[], query: string) =>
	query
		? items.filter(item =>
				[item.label, ...item.search].some(value =>
					value.toLowerCase().includes(query.toLowerCase()),
				),
			)
		: items

function clear(lines: number) {
	if (lines > 0) {
		readline.moveCursor(process.stdout, 0, -lines)
		readline.cursorTo(process.stdout, 0)
		readline.clearScreenDown(process.stdout)
	}
}

function scroll(state: State, total: number) {
	state.selected = Math.min(state.selected, Math.max(0, total - 1))
	if (state.selected < state.start) {
		state.start = state.selected
	} else if (state.selected >= state.start + visible) {
		state.start = state.selected - visible + 1
	}
	state.start = Math.max(0, Math.min(state.start, Math.max(0, total - visible)))
}

function rows(list: readonly Lift.Choice[], state: State) {
	if (list.length === 0) {
		return ['  \x1b[33mNo matches\x1b[0m']
	}
	return list
		.slice(state.start, state.start + visible)
		.map((item, offset) =>
			state.start + offset === state.selected
				? ` \x1b[36m>\x1b[0m \x1b[36m\x1b[1m${item.label}\x1b[0m`
				: `   ${item.label}`,
		)
}

function render(list: readonly Lift.Choice[], state: State, title: string) {
	scroll(state, list.length)
	clear(state.lines)
	const count =
		list.length > 0 ? ` \x1b[90m(${state.selected + 1}/${list.length})\x1b[0m` : ''
	const lines = [
		`${question(`${title} (type to filter):`)}${state.query}${count}`,
		...rows(list, state),
	]
	process.stdout.write(`${lines.join('\n')}\n`)
	state.lines = lines.length
}

function retype(state: State, query: string) {
	Object.assign(state, { query, selected: 0, start: 0 })
	return true
}

function step(state: State, list: readonly Lift.Choice[], key: readline.Key) {
	const delta = deltas[key.name ?? '']
	if (!delta || list.length === 0) {
		return false
	}
	state.selected = Math.min(list.length - 1, Math.max(0, state.selected + delta))
	return true
}

function move(
	state: State,
	list: readonly Lift.Choice[],
	str: string | undefined,
	key: readline.Key,
) {
	if (step(state, list, key)) {
		return true
	}
	if (key.name === 'backspace' && state.query.length > 0) {
		return retype(state, state.query.slice(0, -1))
	}
	if (str?.length === 1 && !key.ctrl && !key.meta) {
		return retype(state, state.query + str)
	}
	return false
}

export async function pick<T extends Lift.Choice>(
	items: readonly T[],
	title: string,
	summary: (item: T) => string,
): Promise<T> {
	if (!process.stdin.isTTY) {
		return items[0]
	}
	const state: State = { query: '', selected: 0, start: 0, lines: 0 }
	readline.emitKeypressEvents(process.stdin)
	process.stdin.setRawMode?.(true)
	render(items, state, title)
	return new Promise<T>(done => {
		const onKeypress = (str: string | undefined, key: readline.Key) => {
			const list = filter(items, state.query)
			if ((key.ctrl && key.name === 'c') || key.name === 'escape') {
				process.stdout.write('\n')
				process.exit(0)
			}
			const chosen = list[state.selected]
			if ((key.name === 'return' || key.name === 'enter') && chosen) {
				process.stdin.removeListener('keypress', onKeypress)
				process.stdin.setRawMode?.(false)
				process.stdin.pause()
				clear(state.lines)
				process.stdout.write(`\x1b[32m✔\x1b[0m ${summary(chosen)}\n`)
				done(chosen)
			} else if (move(state, list, str, key)) {
				render(filter(items, state.query), state, title)
			}
		}
		process.stdin.on('keypress', onKeypress)
	})
}

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue'
import type { DocApi, DocMember, DocMethod, DocProp } from '#docs'
import { read, write } from '../../_lib/controls.ts'
import {
	format,
	invoke,
	type Outcome,
	readMember,
	type Target,
} from '../../_lib/runtime.ts'
import DocsInput from './DocsInput.vue'

const props = defineProps<{
	api: DocApi
	find: () => Target[]
	view: Window | null
	empty: string
	refer?: { type: string; find: () => Target[] }
}>()

type Entry = { id: number; time: string; event: string; index: number; detail: string }

const selected = ref(0)
const targets = shallowRef<Target[]>([])
const tick = ref(0)
const raws = reactive<Record<string, string>>({})
const invalid = reactive<Record<string, boolean>>({})
const results = reactive<Record<string, Outcome>>({})
const log = ref<Entry[]>([])
let counter = 0
let detach = () => {}

const target = computed(() => targets.value[selected.value] ?? targets.value[0] ?? null)
const own = <T extends { base: boolean }>(items: T[]) => items.filter(item => !item.base)
const base = <T extends { base: boolean }>(items: T[]) => items.filter(item => item.base)
const groups = computed(() => [
	{ key: 'own', label: '', open: true, ...pick(own) },
	{ key: 'base', label: 'Base', open: !hasOwn.value, ...pick(base) },
])
const hasOwn = computed(() =>
	[props.api.state, props.api.values, props.api.methods].some(list => own(list).length),
)

function pick(filter: <T extends { base: boolean }>(items: T[]) => T[]) {
	const state = filter(props.api.state)
	const values = filter(props.api.values)
	const methods = filter(props.api.methods)
	return { state, values, methods, size: state.length + values.length + methods.length }
}

const refresh = () => tick.value++
const shown = (name: string) => (tick.value, format(readMember(target.value, name)))
const paramKey = (method: DocMethod, prop: DocProp) => `${method.name}(${prop.name}`
const referable = (param: DocProp) =>
	param.kind === 'none' && param.type === props.refer?.type
const references = computed(() => (tick.value, props.refer?.find() ?? []))
const runnable = (method: DocMethod) =>
	method.params.every(
		param => param.kind !== 'none' || param.optional || referable(param),
	)

function argOf(param: DocProp, raw: string | undefined) {
	if (referable(param)) {
		return references.value[Number(raw ?? 0)]
	}
	return param.kind === 'none' ? undefined : read(param, raw ?? write(param, undefined))
}

function sync() {
	for (const member of props.api.values) {
		try {
			raws[member.name] = write(member, readMember(target.value, member.name))
		} catch {
			raws[member.name] = ''
		}
	}
	refresh()
}

function rescan() {
	targets.value = props.find()
	if (selected.value >= targets.value.length) {
		selected.value = 0
	}
	sync()
}

function assign(member: DocMember, raw: string) {
	raws[member.name] = raw
	try {
		const value = read(member, raw)
		if (target.value) {
			target.value[member.name] = value
		}
		invalid[member.name] = false
		refresh()
	} catch {
		invalid[member.name] = true
	}
}

function argsOf(method: DocMethod): unknown[] | null {
	let valid = true
	const args = method.params.map(param => {
		const key = paramKey(method, param)
		try {
			invalid[key] = false
			return argOf(param, raws[key])
		} catch {
			invalid[key] = true
			valid = false
			return undefined
		}
	})
	return valid ? args : null
}

async function run(method: DocMethod) {
	const args = argsOf(method)
	if (!args || !target.value) {
		return
	}
	results[method.name] = await invoke(target.value, method.name, args, () => {
		results[method.name] = { ok: true, text: 'pending…', pending: true }
		refresh()
	})
	rescan()
}

function locate() {
	const element = target.value as unknown as HTMLElement | null
	element?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
	element?.animate?.(
		[
			{ outline: '2px solid rgb(56 189 248)', outlineOffset: '2px' },
			{ outline: '2px solid transparent', outlineOffset: '2px' },
		],
		{ duration: 1200 },
	)
}

function listen(view: Window | null) {
	detach()
	if (!view) {
		return
	}
	const controller = new AbortController()
	for (const event of props.api.events) {
		view.document.addEventListener(
			`${props.api.name}:${event}`,
			(fired: Event) => {
				log.value = [
					{
						id: counter++,
						time: new Date().toLocaleTimeString(),
						event,
						index: targets.value.indexOf(fired.target as unknown as Target),
						detail: format((fired as CustomEvent).detail),
					},
					...log.value,
				].slice(0, 50)
				rescan()
			},
			{ signal: controller.signal },
		)
	}
	detach = () => controller.abort()
}

watch(selected, sync)
watch(
	() => props.view,
	view => {
		listen(view)
		rescan()
	},
	{ immediate: true },
)
onBeforeUnmount(() => detach())

const heading =
	'px-4 pt-4 pb-1 text-[0.6875rem] tracking-wider text-neutral-500 uppercase'
const row =
	'grid gap-x-6 gap-y-2 border-b border-neutral-800/70 px-4 py-3 @2xl:grid-cols-[minmax(7rem,11rem)_minmax(0,1fr)_minmax(12rem,22rem)]'
const action =
	'flex items-center gap-1 rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:border-neutral-500 hover:text-white disabled:opacity-40'
</script>

<template>
	<div class="@container flex flex-col">
		<div
			class="flex flex-wrap items-center gap-2 border-b border-neutral-800 px-4 py-2 text-xs">
			<code class="font-semibold text-neutral-100">{{ api.className }}</code>
			<template v-if="targets.length > 1">
				<select
					v-model.number="selected"
					aria-label="Instance"
					class="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-neutral-100">
					<option v-for="(item, index) in targets" :key="index" :value="index">
						#{{ index + 1 }} {{ format(item) }}
					</option>
				</select>
				<span class="text-neutral-500">of {{ targets.length }}</span>
			</template>
			<span class="flex-1"></span>
			<button
				v-if="target && 'nodeType' in target"
				type="button"
				:class="action"
				@click="locate">
				Locate
			</button>
			<button type="button" :class="action" @click="rescan">Refresh</button>
		</div>
		<p v-if="!target" class="p-4 text-neutral-500">{{ empty }}</p>
		<template v-else>
			<component
				:is="group.label ? 'details' : 'div'"
				v-for="group in groups.filter(item => item.size)"
				:key="group.key"
				:open="group.label ? group.open : undefined"
				class="group/api">
				<summary
					v-if="group.label"
					class="flex list-none items-center gap-1.5 border-b border-neutral-800 px-4 py-2 text-xs text-neutral-400 select-none hover:text-white [&::-webkit-details-marker]:hidden">
					{{ group.label }}
					<span class="text-neutral-600">{{ group.size }}</span>
				</summary>
				<template v-if="group.state.length">
					<h3 :class="heading">State</h3>
					<div v-for="member in group.state" :key="member.name" :class="row">
						<code class="font-semibold break-all text-neutral-100">{{
							member.name
						}}</code>
						<div class="flex min-w-0 flex-col gap-1 text-xs">
							<p v-if="member.description" class="text-neutral-400">
								{{ member.description }}
							</p>
							<code class="break-words text-sky-300/80">{{
								member.type
							}}</code>
						</div>
						<code class="min-w-0 py-1 text-xs break-all text-emerald-300">{{
							shown(member.name)
						}}</code>
					</div>
				</template>
				<template v-if="group.values.length">
					<h3 :class="heading">Values</h3>
					<div v-for="member in group.values" :key="member.name" :class="row">
						<code class="font-semibold break-all text-neutral-100">{{
							member.name
						}}</code>
						<div class="flex min-w-0 flex-col gap-1 text-xs">
							<p v-if="member.description" class="text-neutral-400">
								{{ member.description }}
							</p>
							<code class="break-words text-sky-300/80">{{
								member.type
							}}</code>
						</div>
						<DocsInput
							:prop="member"
							:raw="raws[member.name] ?? ''"
							:invalid="invalid[member.name] === true"
							@change="value => assign(member, value)" />
					</div>
				</template>
				<template v-if="group.methods.length">
					<h3 :class="heading">Methods</h3>
					<div v-for="method in group.methods" :key="method.name" :class="row">
						<code class="font-semibold break-all text-neutral-100"
							>{{ method.name }}()</code
						>
						<div class="flex min-w-0 flex-col gap-1 text-xs">
							<p v-if="method.description" class="text-neutral-400">
								{{ method.description }}
							</p>
							<code class="break-words text-sky-300/80">
								({{
									method.params
										.map(
											param =>
												`${param.name}${param.optional ? '?' : ''}: ${param.type}`,
										)
										.join(', ')
								}}) => {{ method.returns }}
							</code>
							<code
								v-if="results[method.name]"
								:class="[
									'break-all',
									results[method.name]?.ok
										? 'text-emerald-300'
										: 'text-rose-400',
									results[method.name]?.pending && 'animate-pulse',
								]">
								{{ results[method.name]?.text }}
							</code>
						</div>
						<div class="flex min-w-0 flex-col gap-2">
							<label
								v-for="param in method.params"
								:key="param.name"
								class="flex items-start gap-2 text-xs text-neutral-400">
								<span class="w-16 shrink-0 truncate py-1.5 font-mono">{{
									param.name
								}}</span>
								<select
									v-if="referable(param)"
									:aria-label="param.name"
									:value="raws[paramKey(method, param)] ?? '0'"
									class="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100"
									@change="
										raws[paramKey(method, param)] = (
											$event.target as HTMLSelectElement
										).value
									">
									<option
										v-for="(item, index) in references"
										:key="index"
										:value="String(index)">
										#{{ index + 1 }} {{ format(item) }}
									</option>
								</select>
								<DocsInput
									v-else
									:prop="param"
									:raw="
										raws[paramKey(method, param)] ??
										write(param, undefined)
									"
									:invalid="invalid[paramKey(method, param)] === true"
									@change="
										value => (raws[paramKey(method, param)] = value)
									" />
							</label>
							<button
								type="button"
								:class="[action, 'self-start']"
								:disabled="!runnable(method)"
								:title="
									runnable(method)
										? 'Call it on the selected target'
										: 'Takes a value the playground cannot build'
								"
								@click="run(method)">
								Run
							</button>
						</div>
					</div>
				</template>
			</component>
			<template v-if="api.events.length">
				<div class="flex items-center gap-2 px-4 pt-4 pb-1">
					<h3
						class="text-[0.6875rem] tracking-wider text-neutral-500 uppercase">
						Events
					</h3>
					<span class="flex flex-wrap gap-1">
						<code
							v-for="event in api.events"
							:key="event"
							class="rounded bg-neutral-800 px-1 text-[0.625rem] text-neutral-400">
							{{ api.name }}:{{ event }}
						</code>
					</span>
					<span class="flex-1"></span>
					<button
						v-if="log.length"
						type="button"
						:class="action"
						@click="log = []">
						Clear
					</button>
				</div>
				<p v-if="!log.length" class="px-4 pb-4 text-xs text-neutral-600">
					Nothing fired yet.
				</p>
				<ol v-else class="flex flex-col px-4 pb-4 font-mono text-xs">
					<li
						v-for="entry in log"
						:key="entry.id"
						class="flex gap-3 border-b border-neutral-800/70 py-1">
						<span class="text-neutral-600">{{ entry.time }}</span>
						<span class="text-sky-300">{{ entry.event }}</span>
						<span
							v-if="targets.length > 1 && entry.index >= 0"
							class="text-neutral-500"
							>#{{ entry.index + 1 }}</span
						>
						<span class="min-w-0 break-all text-neutral-300">{{
							entry.detail
						}}</span>
					</li>
				</ol>
			</template>
		</template>
	</div>
</template>

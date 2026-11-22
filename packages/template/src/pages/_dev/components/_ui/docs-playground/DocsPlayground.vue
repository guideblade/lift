<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { serviceAttributes } from '@services'
import { colorSchemes, defaultTheme, themeNames } from '@styles/themes.ts'
import type { DocApi, DocCheck, DocProp } from '#docs'
import { read, same, type Values, write } from '../../_lib/controls.ts'
import { useFrames } from '../../_lib/frames.ts'
import { usePanel } from '../../_lib/panel.ts'
import { instancesIn, managerIn } from '../../_lib/runtime.ts'
import { load, save, setSize } from '../../_lib/state.ts'
import DocsApi from './DocsApi.vue'
import DocsControl from './DocsControl.vue'
import DocsShare from './DocsShare.vue'
import DocsToolbar from './DocsToolbar.vue'

const props = defineProps<{
	title: string
	source: string
	dev: boolean
	preview: string
	samples: Record<string, Values>
	fields: DocProp[]
	widths: { name: string; width: number }[]
	tags: string[]
	checks: DocCheck[]
	instance: DocApi | null
	manager: DocApi | null
}>()

const tabClass =
	'-mb-px border-b-2 border-transparent px-2 py-2.5 text-sm text-neutral-400 hover:text-white aria-selected:border-sky-400 aria-selected:text-white'
const action =
	'flex items-center gap-1 rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white'
const columns =
	'gap-x-6 @2xl:grid-cols-[minmax(7rem,11rem)_minmax(0,1fr)_minmax(12rem,22rem)]'

const editable = props.fields.filter(field => field.kind !== 'none')
const names = Object.keys(props.samples)

const sample = ref(names[0] ?? '')
const raw = reactive<Record<string, string>>({})
const invalid = reactive<Record<string, boolean>>({})
const values = ref<Values>({})
const baseline = ref<Values>({})
const theme = ref(defaultTheme)
const scheme = ref('')
const width = ref('')
const tab = ref('controls')
const scripts = ref(true)
const header = ref<HTMLElement | null>(null)
const divider = ref<HTMLElement | null>(null)
let app: HTMLElement | null = null
let last = ''
let timer: ReturnType<typeof setTimeout> | undefined

const { frames, view, busy, latest, hidden, bind, show, loaded } = useFrames()
const tabs = [
	'controls',
	props.instance && 'instance',
	props.manager && 'manager',
	'docs',
]
const findInstances = () => instancesIn(view.value, props.instance?.name ?? '')
const findManager = () =>
	[managerIn(view.value, props.manager?.name ?? '')].filter(item => item !== null)
const { drag, resetSize, nudge, togglePanel } = usePanel(divider, () => app)

const changed = (name: string) => !same(values.value[name], baseline.value[name])

function collect(): Values | null {
	const out: Values = {}
	let valid = true
	for (const field of editable) {
		try {
			const value = read(field, raw[field.name] ?? '')
			invalid[field.name] = false
			if (value !== undefined) {
				out[field.name] = value
			}
		} catch {
			invalid[field.name] = true
			valid = false
		}
	}
	return valid ? out : null
}

function fill(source: Values) {
	for (const field of editable) {
		raw[field.name] = write(field, source[field.name])
	}
}

function apply(name: string) {
	sample.value = name
	fill(props.samples[name] ?? {})
	baseline.value = collect() ?? {}
	values.value = baseline.value
}

function update(force = false, javascript = scripts.value) {
	const next = collect()
	if (!next) {
		return
	}
	values.value = next
	scripts.value = javascript
	const params = new URLSearchParams({ sample: sample.value, theme: theme.value })
	if (!same(next, baseline.value)) {
		params.set('props', JSON.stringify(next))
	}
	if (scheme.value) {
		params.set('scheme', scheme.value)
	}
	history.replaceState(history.state, '', '?' + params)
	const src = `${props.preview}?${params}`
	if (force || src !== last) {
		last = src
		show(src, scripts.value)
	}
}

function edit(name: string, value: string, typing: boolean) {
	raw[name] = value
	clearTimeout(timer)
	timer = setTimeout(() => update(), typing ? 250 : 0)
}

function choose(name: string) {
	apply(name)
	update()
}

function chooseWidth(next: string) {
	width.value = next
	if (app) {
		setSize(app, '--docs-frame-width', Number(next) || null)
	}
	save({ width: next })
}

function chooseScheme(next: string) {
	scheme.value = next
	save({ scheme: next })
	update()
}

function chooseTheme(next: string) {
	theme.value = next
	save({ theme: next })
	update()
}

function chooseTab(next: string) {
	tab.value = next
	save({ tab: next })
}

function queryProps(search: URLSearchParams): Values | null {
	try {
		return JSON.parse(search.get('props') ?? 'null')
	} catch {
		return null
	}
}

function restore(search: URLSearchParams) {
	const {
		theme: savedTheme = defaultTheme,
		scheme: savedScheme = '',
		width: savedWidth = '',
		tab: savedTab = '',
	} = load()
	const requestedTheme = search.get('theme') ?? savedTheme
	const requestedScheme = search.get('scheme') ?? savedScheme
	theme.value = themeNames.includes(requestedTheme) ? requestedTheme : defaultTheme
	scheme.value = colorSchemes.includes(requestedScheme) ? requestedScheme : ''
	width.value = savedWidth
	tab.value = tabs.includes(savedTab) ? savedTab : 'controls'
}

apply(sample.value)

onMounted(() => {
	app = header.value?.closest<HTMLElement>('[data-docs-app]') ?? null
	const search = new URLSearchParams(location.search)
	restore(search)
	const requested = search.get('sample') ?? ''
	apply(requested in props.samples ? requested : sample.value)
	const override = queryProps(search)
	if (override) {
		fill(override)
	}
	update()
})
</script>

<template>
	<header ref="header">
		<DocsToolbar
			:title="title"
			:source="source"
			:dev="dev"
			:names="names"
			:sample="sample"
			:widths="widths"
			:width="width"
			:theme="theme"
			:scheme="scheme"
			:scripts="scripts"
			:latest="latest"
			:tags="tags"
			:checks="checks"
			@sample="choose"
			@width="chooseWidth"
			@theme="chooseTheme"
			@scheme="chooseScheme"
			@scripts="value => update(true, value)"
			@reload="update(true)" />
	</header>
	<div class="docs-workspace">
		<div
			v-bind="serviceAttributes('scrollbar', { root: 'native' })"
			tabindex="0"
			role="region"
			aria-label="Component preview canvas"
			class="docs-canvas relative min-h-0 min-w-0 flex-1 overflow-auto bg-neutral-900 bg-[radial-gradient(var(--color-neutral-800)_1px,transparent_0)] bg-size-[16px_16px] group-data-dragging/docs:pointer-events-none">
			<div
				class="docs-stage group/stage relative h-full"
				:aria-busy="busy ? 'true' : undefined">
				<span
					class="absolute inset-x-0 top-0 z-10 hidden h-0.5 animate-pulse bg-sky-400 group-aria-busy/stage:block" />
				<iframe
					v-for="frame in frames"
					:key="frame.id"
					:ref="element => bind(frame.id, element)"
					:title="`${title} preview`"
					:src="frame.src"
					:sandbox="
						frame.scripts
							? undefined
							: 'allow-same-origin allow-forms allow-popups'
					"
					:class="['absolute inset-0 size-full', hidden(frame) && 'invisible']"
					@load="loaded(frame)"></iframe>
			</div>
		</div>
		<div
			ref="divider"
			role="separator"
			tabindex="0"
			aria-label="Resize the panel"
			title="Drag to resize, double-click to reset"
			class="docs-divider"
			@pointerdown="drag"
			@dblclick="resetSize"
			@keydown="nudge" />
		<section class="docs-inspector" aria-label="Component inspector">
			<div class="flex min-h-0 min-w-0 flex-1 flex-col">
				<div
					class="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-neutral-800 px-2"
					role="tablist">
					<button
						type="button"
						role="tab"
						:class="tabClass"
						:aria-selected="tab === 'controls'"
						@click="chooseTab('controls')">
						Controls
						<span class="text-neutral-500">{{ editable.length }}</span>
					</button>
					<button
						v-if="instance"
						type="button"
						role="tab"
						:class="tabClass"
						:aria-selected="tab === 'instance'"
						@click="chooseTab('instance')">
						Instance
					</button>
					<button
						v-if="manager"
						type="button"
						role="tab"
						:class="tabClass"
						:aria-selected="tab === 'manager'"
						@click="chooseTab('manager')">
						Manager
					</button>
					<button
						type="button"
						role="tab"
						:class="tabClass"
						:aria-selected="tab === 'docs'"
						@click="chooseTab('docs')">
						Docs
					</button>
					<span class="flex-1"></span>
					<button
						type="button"
						:class="action"
						title="Back to the sample"
						@click="choose(sample)">
						Reset
					</button>
					<button
						type="button"
						:class="[action, 'hidden lg:flex']"
						title="Move the panel"
						aria-label="Move the panel"
						@click="togglePanel">
						<svg viewBox="0 0 16 16" aria-hidden="true" class="size-3.5">
							<rect
								x="2"
								y="2.5"
								width="12"
								height="11"
								rx="1.5"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5" />
							<path
								class="group-data-[panel=right]/docs:hidden"
								d="M10 2.5v11"
								stroke="currentColor"
								stroke-width="1.5" />
							<path
								class="hidden group-data-[panel=right]/docs:block"
								d="M2 9.5h12"
								stroke="currentColor"
								stroke-width="1.5" />
						</svg>
					</button>
				</div>
				<div
					v-show="tab === 'controls'"
					role="tabpanel"
					class="@container min-h-0 flex-1 overflow-y-auto">
					<p v-if="fields.length === 0" class="p-4 text-neutral-500">
						No props.
					</p>
					<template v-else>
						<div
							:class="[
								columns,
								'sticky top-0 z-10 hidden border-b border-neutral-800 bg-neutral-950 px-4 py-2 text-[0.6875rem] tracking-wider text-neutral-500 uppercase @2xl:grid',
							]">
							<span>Name</span>
							<span>Description</span>
							<span>Control</span>
						</div>
						<DocsControl
							v-for="field in fields"
							:key="field.name"
							:prop="field"
							:raw="raw[field.name] ?? ''"
							:changed="field.kind !== 'none' && changed(field.name)"
							:invalid="invalid[field.name] === true"
							@change="
								(value, typing) => edit(field.name, value, typing)
							" />
					</template>
				</div>
				<div
					v-if="instance"
					v-show="tab === 'instance'"
					role="tabpanel"
					class="min-h-0 flex-1 overflow-y-auto">
					<DocsApi
						:api="instance"
						:find="findInstances"
						:view="view"
						empty="No instance in this preview." />
				</div>
				<div
					v-if="manager"
					v-show="tab === 'manager'"
					role="tabpanel"
					class="min-h-0 flex-1 overflow-y-auto">
					<DocsApi
						:api="manager"
						:find="findManager"
						:refer="
							instance
								? { type: instance.className, find: findInstances }
								: undefined
						"
						:view="view"
						empty="The manager has not started in this preview." />
				</div>
				<div
					v-show="tab === 'docs'"
					role="tabpanel"
					class="min-h-0 flex-1 overflow-y-auto">
					<slot name="docs" />
				</div>
			</div>
			<DocsShare v-if="dev" :path="latest" />
		</section>
	</div>
</template>

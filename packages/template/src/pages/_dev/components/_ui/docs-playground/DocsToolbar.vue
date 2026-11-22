<script setup lang="ts">
import { colorSchemes, themeNames } from '@styles/themes.ts'
import type { DocCheck } from '#docs'
import { checkToken, tagToken } from '../../_lib/marks.ts'
const props = defineProps<{
	title: string
	source: string
	dev: boolean
	names: string[]
	sample: string
	widths: { name: string; width: number }[]
	width: string
	theme: string
	scheme: string
	scripts: boolean
	latest: string
	tags: string[]
	checks: DocCheck[]
}>()
const emit = defineEmits<{
	sample: [value: string]
	width: [value: string]
	theme: [value: string]
	scheme: [value: string]
	scripts: [value: boolean]
	reload: []
}>()
const path = props.source.slice(props.source.lastIndexOf('/src/') + 1)
const badge = 'shrink-0 rounded px-1.5 py-0.5 text-[0.6875rem] leading-none'

const schemes = [
	{ value: '', label: 'auto', title: 'Follow the system' },
	...colorSchemes.map(name => ({ value: name, label: name, title: name })),
]
const group = 'flex items-center gap-px rounded-md border border-neutral-800 p-0.5'
const button =
	'flex items-center gap-1 rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white aria-pressed:bg-neutral-800 aria-pressed:text-sky-300'
function openSource() {
	void fetch('/__open-in-editor?file=' + encodeURIComponent(props.source))
}
</script>
<template>
	<div
		class="docs-toolbar flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-neutral-800 px-3 py-2 lg:px-4">
		<div class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
			<h1 class="shrink-0 text-base font-semibold text-white">{{ title }}</h1>
			<button
				v-if="dev"
				type="button"
				title="Open in editor"
				class="truncate font-mono text-xs text-neutral-500 hover:text-sky-300 hover:underline"
				@click="openSource">
				{{ path }}
			</button>
			<code v-else class="truncate text-xs text-neutral-500">{{ path }}</code>
			<div
				v-if="tags.length || checks.length"
				class="hidden flex-wrap items-center gap-1 lg:flex">
				<button
					v-for="tag in tags"
					:key="tag"
					type="button"
					title="Filter by this tag"
					:class="[
						badge,
						'bg-neutral-800 text-neutral-300 hover:bg-neutral-700',
					]"
					:data-docs-filter="tagToken(tag)">
					#{{ tag }}
				</button>
				<button
					v-for="check in checks"
					:key="check.label"
					type="button"
					:title="check.done ? 'Done; filter by it' : 'Open; filter by it'"
					:class="[
						badge,
						check.done
							? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
							: 'border border-neutral-700 text-neutral-400 hover:border-neutral-500',
					]"
					:data-docs-filter="checkToken(check)">
					{{ check.done ? '✓' : '○' }} {{ check.label }}
				</button>
			</div>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<button
				v-if="dev"
				type="button"
				:class="[button, 'lg:hidden']"
				popovertarget="docs-share-panel">
				Share
			</button>
			<label class="flex items-center gap-2 text-xs text-neutral-500">
				<span class="sr-only lg:not-sr-only">Sample</span>
				<select
					class="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-neutral-100 outline-none hover:border-neutral-700 focus:border-sky-500"
					:value="sample"
					@change="emit('sample', ($event.target as HTMLSelectElement).value)">
					<option v-for="name in names" :key="name" :value="name">
						{{ name }}
					</option>
				</select>
			</label>
			<div :class="[group, 'hidden lg:flex']" role="group" aria-label="Viewport">
				<button
					type="button"
					:class="button"
					title="Fill the canvas"
					:aria-pressed="width === ''"
					@click="emit('width', '')">
					full
				</button>
				<button
					v-for="device in widths"
					:key="device.name"
					type="button"
					:class="button"
					:title="`${device.width}px`"
					:aria-pressed="width === String(device.width)"
					@click="emit('width', String(device.width))">
					{{ device.name }}
					<span class="text-neutral-600">{{ device.width }}</span>
				</button>
			</div>
			<label v-if="themeNames.length > 1">
				<span class="sr-only">Theme</span>
				<select
					:value="theme"
					class="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-neutral-100"
					@change="emit('theme', ($event.target as HTMLSelectElement).value)">
					<option v-for="name in themeNames" :key="name" :value="name">
						{{ name }}
					</option>
				</select>
			</label>
			<label class="lg:hidden">
				<span class="sr-only">Color mode</span>
				<select
					:value="scheme"
					class="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-neutral-100"
					@change="emit('scheme', ($event.target as HTMLSelectElement).value)">
					<option
						v-for="option in schemes"
						:key="option.value"
						:value="option.value">
						{{ option.label }}
					</option>
				</select>
			</label>
			<div :class="[group, 'hidden lg:flex']" role="group" aria-label="Color mode">
				<button
					v-for="option in schemes"
					:key="option.value"
					type="button"
					:class="button"
					:title="option.title"
					:aria-pressed="scheme === option.value"
					@click="emit('scheme', option.value)">
					{{ option.label }}
				</button>
			</div>
			<button
				type="button"
				:class="button"
				:aria-pressed="scripts"
				title="Enable JavaScript in the preview"
				@click="emit('scripts', !scripts)">
				JS {{ scripts ? 'on' : 'off' }}
			</button>
			<div :class="group">
				<button
					type="button"
					:class="button"
					title="Reload preview"
					aria-label="Reload preview"
					@click="emit('reload')">
					<svg viewBox="0 0 16 16" aria-hidden="true" class="size-3.5">
						<path
							d="M13 8a5 5 0 1 1-1.5-3.5M13 2.5V5h-2.5"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round" />
					</svg>
				</button>
				<a
					:class="button"
					class="cursor-default"
					target="_blank"
					:href="latest || undefined"
					title="Open in a new tab"
					aria-label="Open in a new tab">
					<svg viewBox="0 0 16 16" aria-hidden="true" class="size-3.5">
						<path
							d="M9 3h4v4M13 3L7.5 8.5M11 9.5V13H3V5h3.5"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round" />
					</svg>
				</a>
			</div>
		</div>
	</div>
</template>

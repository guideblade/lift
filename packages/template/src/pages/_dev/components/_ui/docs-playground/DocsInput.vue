<script setup lang="ts">
import { computed, useId } from 'vue'
import type { DocProp } from '#docs'

const props = defineProps<{
	prop: DocProp
	raw: string
	invalid: boolean
}>()

const emit = defineEmits<{ change: [raw: string, typing: boolean] }>()

const id = useId()
const list = computed(() =>
	props.prop.kind === 'string' && props.prop.options.length ? `docs-${id}` : undefined,
)
const choices = computed(() =>
	props.prop.kind === 'boolean'
		? ['true', 'false'].map(value => ({ value, label: value }))
		: props.prop.options.map((option, index) => ({
				value: String(index),
				label: String(option),
			})),
)
const switches = computed(() => props.prop.kind === 'boolean' && !props.prop.optional)
const selects = computed(
	() =>
		props.prop.kind === 'enum' ||
		(props.prop.kind === 'boolean' && props.prop.optional),
)

const control =
	'w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 hover:border-neutral-600 focus:border-sky-500 data-invalid:border-rose-500'

const text = (event: Event) => (event.target as HTMLInputElement).value
</script>

<template>
	<div class="flex min-w-0 flex-1 items-start">
		<input
			v-if="switches"
			type="checkbox"
			:aria-label="prop.name"
			:checked="raw === 'true'"
			class="relative h-5 w-9 shrink-0 appearance-none rounded-full bg-neutral-700 transition-colors before:absolute before:top-0.5 before:left-0.5 before:size-4 before:rounded-full before:bg-white before:transition-transform checked:bg-sky-500 checked:before:translate-x-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
			@change="
				emit('change', String(($event.target as HTMLInputElement).checked), false)
			" />
		<select
			v-else-if="selects"
			:aria-label="prop.name"
			:class="control"
			:value="raw"
			:data-invalid="invalid ? '' : undefined"
			@change="emit('change', text($event), false)">
			<option v-if="prop.optional" value="">—</option>
			<option v-for="choice in choices" :key="choice.value" :value="choice.value">
				{{ choice.label }}
			</option>
		</select>
		<textarea
			v-else-if="prop.kind === 'string' && !list"
			rows="1"
			:aria-label="prop.name"
			:class="[control, 'field-sizing-content resize-y']"
			:placeholder="prop.optional ? '—' : undefined"
			:value="raw"
			:data-invalid="invalid ? '' : undefined"
			@input="emit('change', text($event), true)"></textarea>
		<input
			v-else-if="list || prop.kind === 'number'"
			:type="prop.kind === 'number' ? 'number' : 'text'"
			:aria-label="prop.name"
			:class="control"
			:list="list"
			:placeholder="prop.optional ? '—' : undefined"
			:value="raw"
			:data-invalid="invalid ? '' : undefined"
			@input="emit('change', text($event), true)" />
		<textarea
			v-else-if="prop.kind === 'json'"
			rows="3"
			:aria-label="prop.name"
			:class="[control, 'field-sizing-content min-h-16 resize-y font-mono text-xs']"
			:placeholder="prop.optional ? '— JSON' : 'JSON'"
			:value="raw"
			:data-invalid="invalid ? '' : undefined"
			@input="emit('change', text($event), true)"></textarea>
		<span v-else class="py-1.5 text-xs text-neutral-600">not editable</span>
		<datalist v-if="list" :id="list">
			<option
				v-for="option in prop.options"
				:key="String(option)"
				:value="String(option)" />
		</datalist>
	</div>
</template>

<script setup lang="ts">
import type { DocProp } from '#docs'
import DocsInput from './DocsInput.vue'

defineProps<{
	prop: DocProp
	raw: string
	changed: boolean
	invalid: boolean
}>()

const emit = defineEmits<{ change: [raw: string, typing: boolean] }>()
</script>

<template>
	<div
		class="group/prop grid gap-x-6 gap-y-2 border-b border-neutral-800/70 px-4 py-3 @2xl:grid-cols-[minmax(7rem,11rem)_minmax(0,1fr)_minmax(12rem,22rem)]"
		:data-changed="changed ? '' : undefined">
		<div class="flex items-baseline gap-1.5">
			<code
				class="font-semibold break-all text-neutral-100 group-data-changed/prop:text-sky-300">
				{{ prop.name }}
			</code>
			<span v-if="!prop.optional" class="text-rose-400" title="Required">*</span>
			<span
				class="hidden size-1.5 shrink-0 self-center rounded-full bg-sky-400 group-data-changed/prop:inline-block"
				title="Changed"></span>
		</div>
		<div class="flex min-w-0 flex-col gap-1.5 text-xs">
			<p v-if="prop.description" class="whitespace-pre-line text-neutral-400">
				{{ prop.description }}
			</p>
			<code class="break-words text-sky-300/80">{{ prop.type }}</code>
			<span
				v-if="prop.default"
				class="flex items-baseline gap-1.5 text-neutral-500">
				Default
				<code class="text-neutral-300">{{ prop.default }}</code>
			</span>
		</div>
		<DocsInput
			:prop="prop"
			:raw="raw"
			:invalid="invalid"
			@change="(value, typing) => emit('change', value, typing)" />
	</div>
</template>

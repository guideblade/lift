<script setup lang="ts">
import { useShare } from '../../_lib/share.ts'
import DocsShareCard from './DocsShareCard.vue'
const props = defineProps<{ path: string }>()
const { current, index, links, message, move } = useShare(() => props.path)
</script>
<template>
	<aside class="docs-share" aria-label="Share component">
		<DocsShareCard
			:current="current"
			:index="index"
			:count="links.length"
			:message="message"
			@move="move" />
	</aside>
	<aside
		id="docs-share-panel"
		popover="auto"
		class="docs-share-panel"
		aria-label="Share component">
		<div class="flex justify-end border-b border-neutral-800 px-3 py-2">
			<button
				type="button"
				class="rounded px-3 py-1 text-xs text-sky-300 hover:bg-neutral-800"
				popovertarget="docs-share-panel"
				popovertargetaction="hide">
				Close
			</button>
		</div>
		<DocsShareCard
			:current="current"
			:index="index"
			:count="links.length"
			:message="message"
			@move="move" />
	</aside>
</template>

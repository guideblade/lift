<script setup lang="ts">
defineProps<{
	current?: { url: string; qr: string }
	index: number
	count: number
	message: string
}>()
const emit = defineEmits<{ move: [direction: number] }>()
</script>

<template>
	<div class="docs-share-card">
		<div class="flex items-center justify-between gap-2">
			<h2
				class="text-[0.6875rem] font-semibold tracking-[0.2em] text-sky-300 uppercase">
				Share
			</h2>
			<span v-if="count" class="font-mono text-[0.625rem] text-neutral-500"
				>{{ index + 1 }} / {{ count }}</span
			>
		</div>
		<p v-if="message" class="text-xs leading-relaxed text-neutral-400" role="status">
			{{ message }}
		</p>
		<template v-if="current">
			<a
				:href="current.url"
				target="_blank"
				rel="noopener"
				class="docs-qr"
				aria-label="Open shared component">
				<img
					:src="current.qr"
					:alt="'QR code for ' + current.url"
					width="192"
					height="192" />
			</a>
			<div class="flex min-w-0 flex-col justify-center gap-2">
				<div class="flex items-center justify-between gap-2">
					<button
						type="button"
						class="docs-share-arrow"
						aria-label="Previous network address"
						:disabled="count < 2"
						@click="emit('move', -1)">
						←
					</button>
					<span
						class="text-[0.625rem] tracking-wider text-neutral-500 uppercase"
						>Network address</span
					>
					<button
						type="button"
						class="docs-share-arrow"
						aria-label="Next network address"
						:disabled="count < 2"
						@click="emit('move', 1)">
						→
					</button>
				</div>
				<a
					:href="current.url"
					target="_blank"
					rel="noopener"
					class="break-all font-mono text-[0.6875rem] leading-relaxed text-sky-300 hover:text-white"
					>{{ current.url }}</a
				>
				<p class="text-[0.625rem] leading-relaxed text-neutral-500">
					Scan on the same Wi-Fi. Your chosen address is remembered.
				</p>
			</div>
		</template>
	</div>
</template>

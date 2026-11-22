<script setup lang="ts">
defineProps<{
	links: { label: string; href: string }[]
}>()
</script>

<template>
	<ul class="flex gap-6">
		<li v-for="link in links" :key="link.href">
			<a :href="link.href">{{ link.label }}</a>
		</li>
	</ul>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const categories = [
	{
		label: 'Shoes',
		links: [
			{ label: 'Running', href: '#running' },
			{ label: 'Trail', href: '#trail' },
		],
	},
	{
		label: 'Bags',
		links: [
			{ label: 'Backpacks', href: '#backpacks' },
			{ label: 'Totes', href: '#totes' },
		],
	},
]

const active = ref(0)
const links = computed(() => categories[active.value]?.links ?? [])
</script>

<template>
	<div class="flex gap-10">
		<ul class="flex flex-col gap-2">
			<li v-for="(category, index) in categories" :key="category.label">
				<button
					type="button"
					:aria-pressed="active === index"
					class="aria-pressed:underline"
					@click="active = index">
					{{ category.label }}
				</button>
			</li>
		</ul>
		<ul class="flex flex-col gap-2">
			<li v-for="link in links" :key="link.href">
				<a :href="link.href">{{ link.label }}</a>
			</li>
		</ul>
	</div>
</template>

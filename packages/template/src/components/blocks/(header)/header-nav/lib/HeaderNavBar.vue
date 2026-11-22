<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { createBlock } from '@libs/bem'
import type { HeaderNavItem } from '../model/header-nav'
import { showOnly } from './headerNavSlots'

const props = defineProps<{
	block: string
	label: string
	start: HeaderNavItem[]
	end: HeaderNavItem[]
}>()

const bem = createBlock(props.block)
const panelAttribute = bem.data('panel')
const root = useTemplateRef<HTMLElement>('root')
const open = ref<string | null>(null)
const sides = computed(() => [
	{ name: 'start', items: props.start },
	{ name: 'end', items: props.end },
])
let trigger: HTMLElement | null = null

function toggle(panel: string, event: MouseEvent) {
	trigger = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
	open.value = open.value === panel ? null : panel
}

function close(focus = false) {
	open.value = null
	if (focus) {
		trigger?.focus()
	}
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape' && open.value) {
		close(true)
	}
}

function onPointerdown(event: PointerEvent) {
	if (open.value && !root.value?.contains(event.target as Node)) {
		close()
	}
}

function onFocusout(event: FocusEvent) {
	const next = event.relatedTarget
	if (next instanceof Node && !root.value?.contains(next)) {
		close()
	}
}

function onClick(event: MouseEvent) {
	const link = event.target instanceof Element ? event.target.closest('a[href]') : null
	if (link?.closest(`[${panelAttribute}]`)) {
		close()
	}
}

watch(open, value => showOnly(root.value, panelAttribute, value))

onMounted(() => {
	document.addEventListener('keydown', onKeydown)
	document.addEventListener('pointerdown', onPointerdown)
})

onBeforeUnmount(() => {
	document.removeEventListener('keydown', onKeydown)
	document.removeEventListener('pointerdown', onPointerdown)
})
</script>

<template>
	<div ref="root" :class="bem.element('inner')" @focusout="onFocusout" @click="onClick">
		<nav :class="bem.element('bar')" :aria-label="label">
			<template v-for="(side, index) in sides" :key="side.name">
				<div v-if="index === 1" :class="bem.element('logo')">
					<slot name="logo" />
				</div>
				<ul :class="[bem.element('list'), bem.element(side.name)]">
					<li
						v-for="(item, position) in side.items"
						:key="position"
						:class="bem.element('item')">
						<a
							v-if="'href' in item"
							:class="bem.element('link')"
							:href="item.href">
							{{ item.label }}
						</a>
						<button
							v-else
							type="button"
							:class="bem.element('toggle')"
							:aria-expanded="open === item.panel"
							@click="toggle(item.panel, $event)">
							{{ item.label }}
						</button>
					</li>
				</ul>
			</template>
			<slot name="menu" />
		</nav>
		<slot name="panels" />
	</div>
</template>

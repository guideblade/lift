<script setup lang="ts">
import {
	computed,
	nextTick,
	onBeforeUnmount,
	onMounted,
	ref,
	useTemplateRef,
	watch,
} from 'vue'
import { createBlock } from '@libs/bem'
import type { HeaderNavMenuItem } from '../model/header-nav'
import { showOnly } from './headerNavSlots'

type Step = { item: HeaderNavMenuItem; index: number }

const props = defineProps<{
	block: string
	items: HeaderNavMenuItem[]
	backLabel: string
}>()

const bem = createBlock(props.block)
const levelAttribute = bem.data('level')
const root = useTemplateRef<HTMLElement>('root')
const list = useTemplateRef<HTMLElement>('list')
const back = useTemplateRef<HTMLButtonElement>('back')
const trail = ref<Step[]>([])
const current = computed(() => trail.value.at(-1)?.item ?? null)
const level = computed(() =>
	current.value && 'level' in current.value ? current.value.level : null,
)
const entries = computed(() => {
	const item = current.value
	if (!item) {
		return props.items
	}
	return 'items' in item ? item.items : []
})
let disclosure: HTMLDetailsElement | null = null

async function enter(item: HeaderNavMenuItem, index: number) {
	trail.value = [...trail.value, { item, index }]
	await nextTick()
	back.value?.focus()
}

async function leave() {
	const step = trail.value.at(-1)
	trail.value = trail.value.slice(0, -1)
	await nextTick()
	list.value?.children[step?.index ?? 0]?.querySelector<HTMLElement>('button')?.focus()
}

function onToggle() {
	if (!disclosure?.open) {
		trail.value = []
	}
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape' && disclosure?.open) {
		disclosure.open = false
		disclosure.querySelector('summary')?.focus()
	}
}

watch(level, value => showOnly(root.value, levelAttribute, value))

onMounted(() => {
	disclosure = root.value?.closest('details') ?? null
	disclosure?.addEventListener('toggle', onToggle)
	disclosure?.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
	disclosure?.removeEventListener('toggle', onToggle)
	disclosure?.removeEventListener('keydown', onKeydown)
})
</script>

<template>
	<div ref="root" :class="bem.element('menu')">
		<div v-if="current" :class="bem.element('step')">
			<button ref="back" type="button" :class="bem.element('back')" @click="leave">
				{{ backLabel }}
			</button>
			<span :class="bem.element('title')">{{ current.label }}</span>
		</div>
		<ul v-if="!level" ref="list" :class="bem.element('level')">
			<li
				v-for="(item, index) in entries"
				:key="index"
				:class="bem.element('entry')">
				<a v-if="'href' in item" :class="bem.element('link')" :href="item.href">
					{{ item.label }}
				</a>
				<button
					v-else
					type="button"
					:class="bem.element('next')"
					@click="enter(item, index)">
					{{ item.label }}
				</button>
			</li>
		</ul>
		<slot name="levels" />
	</div>
</template>

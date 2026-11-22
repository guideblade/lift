<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { data } from './levels.data.ts'
import { above, below, contains, folderOf, kinds, type Level, levelOf } from './levels.ts'

const { placement } = defineProps<{ placement: 'before' | 'after' }>()

const { page } = useData()

const current = computed(() => levelOf(page.value.filePath || page.value.relativePath))
const folder = computed(
	() =>
		current.value?.folder ?? folderOf(page.value.filePath || page.value.relativePath),
)

const where = (path: string) => path || 'repository root'

type Group = { key: string; head: Level; chain: Level[]; deeper: Level[] }

function grouped(levels: readonly Level[]) {
	const found = new Map<string, Group>()
	for (const level of levels) {
		const key = `${level.kind}:${level.name}`
		const group = found.get(key) ?? { key, head: level, chain: [], deeper: [] }
		;(contains(level.folder, folder.value) ? group.chain : group.deeper).push(level)
		found.set(key, group)
	}
	return [...found.values()]
}

const own = computed(() =>
	data.filter(
		level => level.kind === current.value?.kind && level.name === current.value.name,
	),
)

const preceding = computed(() =>
	above(own.value, folder.value).filter(level => level.folder !== folder.value),
)

const deeper = computed(() => below(own.value, folder.value))

const sections = computed(() =>
	kinds
		.map(kind => ({
			...kind,
			groups: grouped(
				[...above(data, folder.value), ...below(data, folder.value)].filter(
					level => level.kind === kind.kind,
				),
			),
		}))
		.filter(section => section.groups.length > 0),
)

const visible = computed(() =>
	current.value
		? (placement === 'before' ? preceding : deeper).value.length > 0
		: placement === 'after' && sections.value.length > 0,
)
</script>

<template>
	<div v-if="visible" class="levels" :class="{ 'is-before': placement === 'before' }">
		<template v-if="current && placement === 'before'">
			<p class="levels-note">Levels above this one, from the root down</p>
			<article v-for="level in preceding" :key="level.url" class="levels-level">
				<a class="levels-where" :href="withBase(level.url)">{{
					where(level.folder)
				}}</a>
				<div class="levels-body" v-html="level.html" />
			</article>
			<p class="levels-note">This level: {{ where(folder) }}</p>
		</template>

		<template v-else-if="current">
			<p class="levels-note">Deeper levels</p>
			<ul>
				<li v-for="level in deeper" :key="level.url">
					<a :href="withBase(level.url)">{{ where(level.folder) }}</a>
					<template v-if="level.description"
						>: {{ level.description }}</template
					>
				</li>
			</ul>
		</template>

		<section v-for="section in sections" v-else :key="section.kind">
			<h2 class="levels-heading">{{ section.label }}</h2>
			<div v-for="group in section.groups" :key="group.key" class="levels-item">
				<h3 class="levels-title">
					<a :href="withBase(group.head.url)">{{ group.head.title }}</a>
				</h3>
				<p v-if="group.head.description" class="levels-description">
					{{ group.head.description }}
				</p>
				<article
					v-for="level in group.chain"
					:key="level.url"
					class="levels-level">
					<a class="levels-where" :href="withBase(level.url)">{{
						where(level.folder)
					}}</a>
					<div class="levels-body" v-html="level.html" />
				</article>
				<p v-if="group.deeper.length > 0" class="levels-note">
					Deeper:
					<template v-for="(level, index) in group.deeper" :key="level.url">
						<a :href="withBase(level.url)">{{ where(level.folder) }}</a
						><template v-if="index < group.deeper.length - 1">, </template>
					</template>
				</p>
			</div>
		</section>
	</div>
</template>

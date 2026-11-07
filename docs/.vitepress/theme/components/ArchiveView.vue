<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import { data as posts } from '../../posts.data'
import type { PostMeta } from '../../posts.data'

const activeTag = ref('')

const allTags = computed(() =>
  Array.from(new Set(posts.flatMap((p: PostMeta) => p.tags))).sort()
)

const filtered = computed(() =>
  activeTag.value ? posts.filter((p: PostMeta) => p.tags.includes(activeTag.value)) : posts
)

const groups = computed(() => {
  const map = new Map<string, PostMeta[]>()
  for (const p of filtered.value) {
    const year = p.date.slice(0, 4)
    if (!map.has(year)) map.set(year, [])
    map.get(year)!.push(p)
  }
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
})

function toggleTag(tag: string) {
  activeTag.value = activeTag.value === tag ? '' : tag
}
</script>

<template>
  <h1 class="page-title">归档</h1>

  <div v-if="allTags.length" class="tag-cloud">
    <button
      v-for="t in allTags"
      :key="t"
      class="tag-btn"
      :class="{ active: activeTag === t }"
      @click="toggleTag(t)"
    >
      #{{ t }}
    </button>
    <button v-if="activeTag" class="tag-btn clear" @click="toggleTag(activeTag)">清除筛选</button>
  </div>

  <section v-for="[year, items] in groups" :key="year" class="year-group">
    <h2 class="year">{{ year }}</h2>
    <ul class="archive-list">
      <li v-for="p in items" :key="p.url" class="archive-item">
        <span class="date">{{ p.date }}</span>
        <a class="title" :href="withBase(p.url)">{{ p.title }}</a>
        <span v-for="t in p.tags" :key="t" class="tag">#{{ t }}</span>
      </li>
    </ul>
  </section>

  <p v-if="!filtered.length" class="empty">这个标签下还没有文章。</p>
</template>

<style scoped>
.page-title {
  margin: 2.5rem 0 1rem;
  font-size: 1.5rem;
}
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
}
.tag-btn {
  border: 1px solid var(--border);
  background: none;
  color: var(--muted);
  font-size: 0.8125rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
}
.tag-btn:hover {
  color: var(--fg);
  border-color: var(--muted);
}
.tag-btn.active {
  color: var(--bg);
  background: var(--fg);
  border-color: var(--fg);
}
.tag-btn.clear {
  border-style: dashed;
}
.year-group {
  margin-bottom: 2rem;
}
.year {
  font-size: 1.125rem;
  margin: 0 0 0.5rem;
  color: var(--muted);
}
.archive-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.archive-item {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.5rem 0;
  flex-wrap: wrap;
}
.archive-item .date {
  color: var(--muted);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  min-width: 6.5rem;
}
.archive-item .title:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 1px;
}
.empty {
  color: var(--muted);
}
</style>

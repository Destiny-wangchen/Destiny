<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { data as posts } from '../../posts.data'
import { findSeries, type SeriesItem } from '../../series'
import type { PostMeta } from '../../posts.data'

const { page, frontmatter } = useData()

// posts.data 里的 url 形如 /posts/hello-world.html，页面数据里是 posts/hello-world.md
const currentUrl = computed(() => `/${page.value.relativePath.replace(/\.md$/, '.html')}`)
const current = computed(() => posts.find((p: PostMeta) => p.url === currentUrl.value))

// 页面 frontmatter 声明的系列（cbook/icbook 等非 posts 页由此接入系列导航）
const fmSeries = computed(() => String(frontmatter.value.series ?? ''))

interface NavEntry {
  title: string
  url: string
  order: number
  date?: string
}

// 同系列按 seriesOrder 排；无系列的全站在时间轴上按正序排（上一篇 = 更早的一篇）
const ordered = computed<NavEntry[]>(() => {
  // 1) frontmatter 指定了系列（例题册/手册章节页）：按注册表取全系列
  if (fmSeries.value) {
    const def = findSeries(fmSeries.value)
    if (def) return def.items.map((i: SeriesItem) => ({ title: i.title, url: i.link, order: i.order }))
  }
  // 2) 注册表里的文章系列（同一系列的文章散落在注册表时，以注册表为准）
  if (current.value?.series) {
    const def = findSeries(current.value.series)
    if (def) return def.items.map((i: SeriesItem) => ({ title: i.title, url: i.link, order: i.order }))
    // 系列未进注册表：退回 posts.data 内部聚合
    return posts
      .filter((p: PostMeta) => p.series === current.value!.series)
      .sort((a, b) => a.seriesOrder - b.seriesOrder || a.date.localeCompare(b.date))
  }
  // 3) 无系列文章：全站时间轴
  return [...posts]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p: PostMeta) => ({ title: p.title, url: p.url, order: 0, date: p.date }))
})

const index = computed(() => ordered.value.findIndex((e) => e.url === currentUrl.value))
const inSeriesNav = computed(() => !!fmSeries.value || !!current.value?.series)
const total = computed(() => (inSeriesNav.value ? ordered.value.length : 0))

const prev = computed(() => (index.value > 0 ? ordered.value[index.value - 1] : null))
const next = computed(() =>
  index.value >= 0 && index.value < ordered.value.length - 1 ? ordered.value[index.value + 1] : null
)

// 只有系列文章才显示（2/4）这样的进度
const progress = (i: number) => (total.value ? `（${i + 1}/${total.value}）` : '')
</script>

<template>
  <nav v-if="prev || next" class="post-nav" aria-label="文章导航">
    <a
      v-if="prev"
      class="nav-item prev"
      :href="withBase(prev.url)"
    >
      <span class="nav-label">← 上一篇{{ progress(index - 1) }}</span>
      <span class="nav-title">{{ prev.title }}</span>
    </a>
    <span v-else class="nav-item" aria-hidden="true" />

    <a
      v-if="next"
      class="nav-item next"
      :href="withBase(next.url)"
    >
      <span class="nav-label">下一篇{{ progress(index + 1) }} →</span>
      <span class="nav-title">{{ next.title }}</span>
    </a>
    <span v-else class="nav-item" aria-hidden="true" />
  </nav>
</template>

<style scoped>
.post-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}
.nav-item {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.nav-item.next {
  align-items: flex-end;
  text-align: right;
}
.nav-label {
  color: var(--muted);
  font-size: 0.8125rem;
}
.nav-title {
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5;
}
.nav-item:hover .nav-title {
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 1px;
}
@media (max-width: 640px) {
  .post-nav {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
  .nav-item.next {
    align-items: flex-start;
    text-align: left;
  }
}
</style>

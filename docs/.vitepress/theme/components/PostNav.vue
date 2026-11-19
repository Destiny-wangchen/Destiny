<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { data as posts } from '../../posts.data'
import { data as bookPages } from '../../book.data'

interface NavItem {
  url: string
  title: string
  series: string
  seriesOrder: number
  date: string
  isBook: boolean
}

const { page } = useData()

// currentUrl 口径与内容加载器一致：cbook/index.md → /cbook/，posts/hello-world.md → /posts/hello-world.html
const currentUrl = computed(() => {
  const rel = page.value.relativePath.replace(/(^|\/)index\.md$/, '$1')
  return `/${rel.replace(/\.md$/, '.html')}`
})

const bookItems: NavItem[] = bookPages.map((p) => ({
  url: p.url,
  title: p.title,
  series: p.series,
  seriesOrder: p.seriesOrder,
  date: '',
  isBook: true
}))
const postItems: NavItem[] = posts.map((p) => ({
  url: p.url,
  title: p.title,
  series: p.series,
  seriesOrder: p.seriesOrder,
  date: p.date,
  isBook: false
}))

const current = computed(
  () => bookItems.find((p) => p.url === currentUrl.value) ?? postItems.find((p) => p.url === currentUrl.value)
)

// 同一系列可能同时包含目录页/章节（bookPages）与普通文章（posts），如「网站开发」「C语言」。
// 统一成一条链：目录页（seriesOrder 0）排最前，其余按各自 seriesOrder 排。
const siblings = computed<NavItem[]>(() => {
  const c = current.value
  if (!c) return []
  const same = (p: NavItem) => p.series !== '' && p.series === c.series
  const cover = bookItems.find((p) => same(p) && p.seriesOrder === 0)
  const chapters = [
    ...bookItems.filter((p) => same(p) && p.seriesOrder > 0),
    ...postItems.filter(same)
  ].sort((a, b) => a.seriesOrder - b.seriesOrder)
  // 不成系列：落在全站时间轴上（上一篇 = 更早的一篇）
  if (!cover && chapters.length <= 1) {
    return postItems.slice().sort((a, b) => a.date.localeCompare(b.date))
  }
  return [...(cover ? [cover] : []), ...chapters]
})

const numbered = computed(() => !!current.value?.series && siblings.value.length > 1)

const index = computed(() => (current.value ? siblings.value.indexOf(current.value) : -1))
const prev = computed(() => (index.value > 0 ? siblings.value[index.value - 1] : null))
const next = computed(() =>
  index.value >= 0 && index.value < siblings.value.length - 1 ? siblings.value[index.value + 1] : null
)

// 目录页 = 书籍封面（isBook 且 seriesOrder 0）。
// 普通文章没有 series 字段时 seriesOrder 也是 0，不能误判成目录页。
const isCover = (item: NavItem) => item.isBook && item.seriesOrder === 0

function posOf(item: NavItem) {
  if (!numbered.value) return ''
  if (isCover(item)) return '' // 目录页不占编号
  const rest = siblings.value.filter((p) => !isCover(p))
  const i = rest.indexOf(item)
  return i >= 0 ? `（${i + 1}/${rest.length}）` : ''
}

const prevLabel = computed(() => {
  if (!prev.value) return ''
  // 章节链的上家是目录页时，文案换成「目录」
  if (isCover(prev.value)) return '← 目录'
  return `← 上一篇${posOf(prev.value)}`
})
const nextLabel = computed(() => (next.value ? `下一篇${posOf(next.value)} →` : ''))
</script>

<template>
  <nav v-if="prev || next" class="post-nav" aria-label="文章导航">
    <a v-if="prev" class="nav-item prev" :href="withBase(prev.url)">
      <span class="nav-label">{{ prevLabel }}</span>
      <span class="nav-title">{{ prev.title }}</span>
    </a>
    <span v-else class="nav-item" aria-hidden="true" />

    <a v-if="next" class="nav-item next" :href="withBase(next.url)">
      <span class="nav-label">{{ nextLabel }}</span>
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

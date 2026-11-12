<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import MiniSearch from 'minisearch'

interface Doc {
  url: string
  title: string
  date: string
  tags: string[]
  text: string
}

const open = ref(false)
const q = ref('')
const results = ref<Doc[]>([])
const active = ref(0)
let mini: MiniSearch<Doc> | null = null

// 索引在首次打开搜索时才加载
async function ensureIndex() {
  if (mini) return
  const res = await fetch(withBase('search-index.json'))
  const docs = (await res.json()) as Doc[]
  mini = new MiniSearch<Doc>({
    fields: ['title', 'tags', 'text'],
    storeFields: ['url', 'title', 'date', 'text']
  })
  mini.addAll(docs)
}

watch(open, (v) => {
  if (v) ensureIndex()
})

watch(q, (val) => {
  const kw = val.trim()
  if (!mini) return
  if (!kw) {
    results.value = []
    return
  }
  results.value = mini.search(kw, { fuzzy: 0.2, prefix: true }).slice(0, 8) as unknown as Doc[]
  active.value = 0
})

// 摘要：定位关键词位置，前后各取一段
function snippet(d: Doc) {
  const kw = q.value.trim()
  if (!kw) return d.text.slice(0, 70)
  const i = d.text.indexOf(kw)
  if (i < 0) return d.text.slice(0, 70)
  const start = Math.max(0, i - 20)
  return (start > 0 ? '…' : '') + d.text.slice(start, start + 80)
}

function go(d: Doc) {
  open.value = false
  window.location.href = withBase(d.url)
}

function onEnter() {
  if (results.value[active.value]) go(results.value[active.value])
}

function onGlobalKey(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open.value = !open.value
  }
  if (e.key === 'Escape') open.value = false
}

onMounted(() => window.addEventListener('keydown', onGlobalKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKey))
</script>

<template>
  <button
    class="search-btn icon-link"
    type="button"
    aria-label="搜索"
    title="搜索 (Ctrl+K)"
    @click="open = true"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  </button>

  <Teleport to="body">
    <div v-if="open" class="search-mask" @click.self="open = false">
      <div class="search-panel">
        <div class="search-bar">
          <input
            v-model="q"
            class="search-input"
            type="text"
            placeholder="搜索全站文章…"
            autofocus
            @keydown.down.prevent="active = Math.min(active + 1, results.length - 1)"
            @keydown.up.prevent="active = Math.max(active - 1, 0)"
            @keydown.enter.prevent="onEnter"
          />
          <button class="search-close" type="button" @click="open = false">Esc</button>
        </div>

        <ul v-if="results.length" class="search-results">
          <li
            v-for="(r, i) in results"
            :key="r.url"
            :class="{ active: i === active }"
            @mouseenter="active = i"
            @click="go(r)"
          >
            <div class="sr-head">
              <span class="sr-title">{{ r.title }}</span>
              <span class="sr-date">{{ r.date }}</span>
            </div>
            <p class="sr-snippet">{{ snippet(r) }}</p>
          </li>
        </ul>

        <p v-else-if="q.trim()" class="search-empty">没有找到相关内容，换个词试试。</p>
        <p v-else class="search-empty search-tip">输入关键词搜索；支持 Ctrl + K 快速唤起</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.search-btn {
  border: none;
  background: none;
  cursor: pointer;
}

.search-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
}

.search-panel {
  width: min(560px, calc(100vw - 2rem));
  margin: 14vh auto 0;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid var(--border);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--fg);
  font-size: 1rem;
  font-family: inherit;
}

.search-close {
  border: 1px solid var(--border);
  border-radius: 4px;
  background: none;
  color: var(--muted);
  font-size: 0.6875rem;
  padding: 0.1rem 0.4rem;
  cursor: pointer;
}

.search-results {
  list-style: none;
  margin: 0;
  padding: 0.35rem;
  max-height: 50vh;
  overflow-y: auto;
}

.search-results li {
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
}

.search-results li.active {
  background: var(--code-bg);
}

.sr-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.sr-title {
  font-weight: 500;
}

.sr-date {
  color: var(--muted);
  font-size: 0.75rem;
  flex-shrink: 0;
}

.sr-snippet {
  margin: 0.25rem 0 0;
  color: var(--muted);
  font-size: 0.8125rem;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-empty {
  margin: 0;
  padding: 1.4rem;
  text-align: center;
  color: var(--muted);
  font-size: 0.875rem;
}
</style>

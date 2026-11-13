<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useData, useRoute } from 'vitepress'

const { page, frontmatter } = useData()
const route = useRoute()

interface TocItem {
  level: number
  title: string
  slug: string
  link: string
}

// 只收 h2；至少两节才有目录的价值，单节直接隐藏
const items = computed(() => ((page.value.headers ?? []) as TocItem[]).filter((h) => h.level === 2))

// frontmatter 写 toc: false 可手动关闭
const show = computed(
  () => frontmatter.value.toc !== false && items.value.length >= 2
)

// —— 当前节高亮（scrollspy）——
// 规则：取视口顶部（96px 处）之上最近的那个 h2，即“读者正在读的节”
const activeSlug = ref('')

function updateActive() {
  let current = ''
  for (const h of items.value) {
    const el = document.getElementById(h.slug)
    if (el && el.getBoundingClientRect().top <= 96) current = h.slug
  }
  activeSlug.value = current
}

// —— 阅读进度（0~1，按文章元素计算，不含页头页脚）——
const progress = ref(0)

function updateProgress() {
  const rail = document.querySelector('.toc-rail') ?? document.querySelector('.toc')
  const article = rail?.closest('article')
  if (!article) return
  const rect = article.getBoundingClientRect()
  const total = rect.height - window.innerHeight
  progress.value = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1
}

function onScroll() {
  updateActive()
  updateProgress()
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))

// SPA 切文章后重新定位一次，并顺手收起浮动面板
const open = ref(false)
watch(
  () => route.path,
  () => {
    open.value = false
    nextTick(onScroll)
  }
)
</script>

<template>
  <!-- 宽屏（≥1200px）：正文右侧常驻导览轨 -->
  <aside v-if="show" class="toc-rail" aria-label="文章导览">
    <div class="toc-progress"><i :style="{ transform: `scaleX(${progress})` }" /></div>
    <ul class="toc-rail-list">
      <li v-for="h in items" :key="h.slug">
        <a :href="h.link" :class="{ active: activeSlug === h.slug }">{{ h.title }}</a>
      </li>
    </ul>
  </aside>

  <!-- 窄屏：正文上方的目录块 -->
  <nav v-if="show" class="toc" aria-label="本文目录">
    <p class="toc-title">本文目录（{{ items.length }} 节）</p>
    <ul class="toc-list">
      <li v-for="h in items" :key="h.slug">
        <a :href="h.link" :class="{ active: activeSlug === h.slug }">{{ h.title }}</a>
      </li>
    </ul>
  </nav>

  <!-- 窄屏：右下角浮动按钮 + 弹出列表 -->
  <div v-if="show" class="toc-fab">
    <transition name="toc-pop">
      <ul v-if="open" class="toc-sheet">
        <li v-for="h in items" :key="h.slug">
          <a :href="h.link" :class="{ active: activeSlug === h.slug }" @click="open = false">
            {{ h.title }}
          </a>
        </li>
      </ul>
    </transition>
    <button class="toc-fab-btn" :aria-expanded="open" aria-label="章节目录" @click="open = !open">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
        <path d="M2 4h12M2 8h12M2 12h8" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
/* ============ 顶部目录块（窄屏显示，宽屏隐藏） ============ */
.toc {
  margin: 0.5rem 0 2.5rem;
  padding: 1.25rem 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.toc-title {
  margin: 0 0 0.75rem;
  color: var(--muted);
  font-size: 0.8125rem;
  letter-spacing: 0.05em;
}
.toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.toc-list li {
  line-height: 2;
}
.toc-list a {
  color: var(--muted);
  font-size: 0.9375rem;
}
.toc-list a:hover,
.toc-list a.active {
  color: var(--fg);
}
.toc-list a.active {
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
}
@media (min-width: 1040px) {
  .toc {
    display: none;
  }
}

/* ============ 宽屏：右侧导览轨 ============ */
/* 贴着正文右边缘：正文栏 672px 居中，右边缘在 50% + 336px - 24px(内边距) 处 */
/* 1040~1200px（Windows 125%/150% 缩放、窗口没开满时常见）：紧凑轨 */
.toc-rail {
  display: none;
  position: fixed;
  left: calc(50% + 20rem);
  top: 120px;
  width: 170px;
  max-height: calc(100vh - 160px);
  overflow-y: auto;
  z-index: 10;
}
@media (min-width: 1040px) {
  .toc-rail {
    display: block;
  }
}
@media (min-width: 1200px) {
  .toc-rail {
    left: calc(50% + 21.5rem);
    width: 200px;
  }
}
.toc-progress {
  position: relative;
  height: 2px;
  margin-bottom: 1rem;
  background: var(--border);
}
.toc-progress i {
  position: absolute;
  inset: 0;
  background: var(--fg);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.1s linear;
}
.toc-rail-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.toc-rail-list li {
  margin: 0;
}
.toc-rail-list a {
  display: block;
  padding: 0.25rem 0 0.25rem 0.75rem;
  border-left: 2px solid transparent;
  color: var(--muted);
  font-size: 0.8125rem;
  line-height: 1.6;
}
.toc-rail-list a:hover {
  color: var(--fg);
}
.toc-rail-list a.active {
  color: var(--fg);
  font-weight: 600;
  border-left-color: var(--fg);
}

/* ============ 窄屏：右下角浮动按钮 ============ */
.toc-fab {
  display: none;
  position: fixed;
  right: 1.25rem;
  bottom: 1.5rem;
  z-index: 50;
}
@media (max-width: 1039.98px) {
  .toc-fab {
    display: block;
  }
}
.toc-fab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--bg);
  color: var(--muted);
  cursor: pointer;
}
.toc-fab-btn:hover {
  color: var(--fg);
  border-color: var(--muted);
}
.toc-sheet {
  position: absolute;
  right: 0;
  bottom: 3.25rem;
  min-width: 220px;
  max-width: 70vw;
  max-height: 55vh;
  overflow-y: auto;
  margin: 0;
  padding: 0.5rem 0;
  list-style: none;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
.toc-sheet a {
  display: block;
  padding: 0.4rem 1rem;
  color: var(--muted);
  font-size: 0.875rem;
  line-height: 1.6;
}
.toc-sheet a:hover {
  color: var(--fg);
}
.toc-sheet a.active {
  color: var(--fg);
  font-weight: 600;
}
.toc-pop-enter-active,
.toc-pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.toc-pop-enter-from,
.toc-pop-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>

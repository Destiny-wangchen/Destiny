<script setup lang="ts">
import { ref, watch } from 'vue'
import { useData, useRoute } from 'vitepress'
import { withBase } from 'vitepress'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import HomeView from './components/HomeView.vue'
import ArchiveView from './components/ArchiveView.vue'
import ProjectsView from './components/ProjectsView.vue'
import AppsView from './components/AppsView.vue'
import QuizApp from './components/QuizApp.vue'
import VaultView from './components/VaultView.vue'
import WriteView from './components/WriteView.vue'
import PageView from './components/PageView.vue'
import Share from './components/Share.vue'
import Toc from './components/Toc.vue'
import PostNav from './components/PostNav.vue'
import { formatDate, simplifyDate } from './formatDate'
import { useGardenSecret } from './useGardenSecret'
import { data as bookPages } from '../book.data'

const { page, frontmatter } = useData()
const { unlocked } = useGardenSecret()

// 花锁未解锁时，私密页与写作页一律当作不存在的页面
const secretGuarded = () =>
  ['vault', 'write'].includes(String(frontmatter.value.layout)) && !unlocked.value

// 返回目标：进本页之前的那一页（VitePress 把它存在 history.state.back 里）。
// 不能用 history.back()——目录锚点跳转也会压一条历史，回退只会撤销那次跳转，
// 而不是离开当前文章。这里在挂载时把上一页记下来，之后无论怎么跳锚点都指向它。
// 例外：书籍章节页（seriesOrder > 0）的返回固定指向本书目录页，符合“读一本书”的心智。
const route = useRoute()
const backHref = ref(withBase('/'))
const backLabel = ref('← 返回')

// 当前页若是书籍章节，返回其所属书的目录页（seriesOrder 0）；否则 null
function findChapterCover() {
  const rel = page.value.relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '.html')
  const cur = bookPages.find((p) => p.url === `/${rel}`)
  if (!cur || cur.seriesOrder === 0 || !cur.series) return null
  return bookPages.find((p) => p.series === cur.series && p.seriesOrder === 0) ?? null
}

function resolveBack() {
  const cover = findChapterCover()
  if (cover) {
    backHref.value = withBase(cover.url)
    backLabel.value = '← 返回目录'
    return
  }
  backLabel.value = '← 返回'
  if (typeof window === 'undefined') return
  const back = (window.history.state as { back?: string } | null)?.back
  if (typeof back === 'string' && back) {
    const url = new URL(back, window.location.origin)
    // 同一个页面（只是 hash 不同）不算上一级
    if (url.pathname !== window.location.pathname) {
      backHref.value = url.pathname + url.search
      return
    }
  }
  backHref.value = withBase('/')
}

watch(() => route.path, resolveBack, { immediate: true })
</script>

<template>
  <div class="app">
    <Header />
    <main class="container">
      <article v-if="secretGuarded() || page.isNotFound" class="not-found">
        <h1>404</h1>
        <p>这个页面还没有长出来，<a :href="withBase('/')">回花园看看</a>吧。</p>
      </article>

      <HomeView v-else-if="frontmatter.layout === 'home'" />
      <ArchiveView v-else-if="frontmatter.layout === 'archive'" />
      <ProjectsView v-else-if="frontmatter.layout === 'projects'" />
      <AppsView v-else-if="frontmatter.layout === 'apps'" />
      <QuizApp v-else-if="frontmatter.layout === 'quiz'" />
      <VaultView v-else-if="frontmatter.layout === 'vault'" />
      <WriteView v-else-if="frontmatter.layout === 'write'" />

      <article v-else class="post">
        <a class="back-link" :href="backHref">{{ backLabel }}</a>
        <header class="post-header">
          <h1 class="post-title">{{ frontmatter.title }}</h1>
          <div class="post-meta">
            <span v-if="frontmatter.date">{{ simplifyDate(formatDate(frontmatter.date)) }}</span>
            <span v-for="t in frontmatter.tags || []" :key="t" class="tag">#{{ t }}</span>
          </div>
        </header>
        <Toc />
        <div class="post-content">
          <Content />
        </div>
        <PostNav />
        <div class="post-footer-info"><Share /><PageView /></div>
      </article>
    </main>
    <Footer />
  </div>
</template>

<style scoped>
/* 吸附在视口左上，长文往下翻也随时能返回 */
.back-link {
  position: sticky;
  top: 0.5rem;
  z-index: 20;
  display: inline-block;
  width: fit-content;
  margin: 1.5rem 0 0 -0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  color: var(--muted);
  font-size: 0.875rem;
  background: var(--bg);
  box-shadow: 0 0 0 6px var(--bg);
}
.back-link:hover {
  color: var(--fg);
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 1px;
}
.post-header {
  margin: 1rem 0 1.5rem;
}
.post-header .post-title {
  font-size: 1.75rem;
  line-height: 1.3;
  margin: 0 0 0.5rem;
}
.post-footer-info {
  margin-top: 3rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
  color: var(--muted);
  font-size: 0.875rem;
}
.not-found {
  padding: 5rem 0;
  text-align: center;
}
.not-found a {
  text-decoration: underline;
  text-underline-offset: 4px;
}
</style>

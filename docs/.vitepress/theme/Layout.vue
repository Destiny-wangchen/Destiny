<script setup lang="ts">
import { useData } from 'vitepress'
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
import { formatDate } from './formatDate'
import { useGardenSecret } from './useGardenSecret'

const { page, frontmatter } = useData()
const { unlocked } = useGardenSecret()

// 花锁未解锁时，私密页与写作页一律当作不存在的页面
const secretGuarded = () =>
  ['vault', 'write'].includes(String(frontmatter.value.layout)) && !unlocked.value

// 返回：同站内来路用浏览器后退（保留列表位置），直接打开的文章回首页
function goBack(e: MouseEvent) {
  const ref = document.referrer
  if (ref && new URL(ref).origin === window.location.origin && window.history.length > 1) {
    e.preventDefault()
    window.history.back()
  }
}
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
        <a class="back-link" :href="withBase('/')" @click="goBack">← 返回</a>
        <header class="post-header">
          <h1 class="post-title">{{ frontmatter.title }}</h1>
          <div class="post-meta">
            <span v-if="frontmatter.date">{{ formatDate(frontmatter.date) }}</span>
            <span v-for="t in frontmatter.tags || []" :key="t" class="tag">#{{ t }}</span>
          </div>
        </header>
        <div class="post-content">
          <Content />
        </div>
        <div class="post-footer-info"><PageView /></div>
      </article>
    </main>
    <Footer />
  </div>
</template>

<style scoped>
.back-link {
  display: inline-block;
  margin-top: 2.5rem;
  color: var(--muted);
  font-size: 0.875rem;
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

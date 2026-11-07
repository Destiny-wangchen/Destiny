<script setup lang="ts">
import { useData } from 'vitepress'
import { withBase } from 'vitepress'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import HomeView from './components/HomeView.vue'
import ArchiveView from './components/ArchiveView.vue'
import ProjectsView from './components/ProjectsView.vue'
import PageView from './components/PageView.vue'

const { page, frontmatter } = useData()
</script>

<template>
  <div class="app">
    <Header />
    <main class="container">
      <HomeView v-if="frontmatter.layout === 'home'" />
      <ArchiveView v-else-if="frontmatter.layout === 'archive'" />
      <ProjectsView v-else-if="frontmatter.layout === 'projects'" />

      <article v-else-if="page.isNotFound" class="not-found">
        <h1>404</h1>
        <p>这个页面还没有长出来，<a :href="withBase('/')">回花园看看</a>吧。</p>
      </article>

      <article v-else class="post">
        <header class="post-header">
          <h1 class="post-title">{{ frontmatter.title }}</h1>
          <div class="post-meta">
            <span v-if="frontmatter.date">{{ frontmatter.date }}</span>
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
.post-header {
  margin: 2.5rem 0 1.5rem;
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

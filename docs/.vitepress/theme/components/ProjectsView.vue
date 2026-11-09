<script setup lang="ts">
import { useData, withBase } from 'vitepress'

interface Project {
  name: string
  desc: string
  link?: string
  app?: string
  repo?: string
  tags?: string[]
}

const { frontmatter } = useData()
const items = (frontmatter.value.items ?? []) as Project[]
</script>

<template>
  <h1 class="page-title">项目</h1>
  <p class="page-desc">一些我做过或正在维护的东西。</p>

  <ul class="project-list">
    <li v-for="p in items" :key="p.name" class="project-card">
      <div class="project-head">
        <!-- app: 站内应用页跳转；link: 外部链接 -->
        <a v-if="p.app" class="project-name" :href="withBase(p.app)">
          {{ p.name }} →
        </a>
        <a v-else-if="p.link" class="project-name" :href="p.link" target="_blank" rel="noopener">
          {{ p.name }} ↗
        </a>
        <span v-else class="project-name">{{ p.name }}</span>
        <a v-if="p.repo" class="project-repo" :href="p.repo" target="_blank" rel="noopener">GitHub</a>
      </div>
      <p class="project-desc">{{ p.desc }}</p>
      <div v-if="p.tags?.length" class="project-tags">
        <span v-for="t in p.tags" :key="t" class="tag">#{{ t }}</span>
      </div>
    </li>
  </ul>

  <p v-if="!items.length" class="empty">项目列表为空，请在 projects.md 的 frontmatter 中添加。</p>
</template>

<style scoped>
.page-title {
  margin: 2.5rem 0 0.5rem;
  font-size: 1.5rem;
}
.page-desc {
  color: var(--muted);
  margin: 0 0 2rem;
}
.project-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 1rem;
}
.project-card {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  transition: border-color 0.2s;
}
.project-card:hover {
  border-color: var(--muted);
}
.project-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}
.project-name {
  font-weight: 600;
}
.project-name:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}
.project-repo {
  color: var(--muted);
  font-size: 0.8125rem;
}
.project-repo:hover {
  color: var(--fg);
}
.project-desc {
  margin: 0.5rem 0 0;
  color: var(--muted);
  font-size: 0.9375rem;
}
.project-tags {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.empty {
  color: var(--muted);
}
</style>

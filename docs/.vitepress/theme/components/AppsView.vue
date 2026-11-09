<script setup lang="ts">
import { useData, withBase } from 'vitepress'

interface AppMeta {
  name: string
  desc: string
  path: string
  tags?: string[]
}

const { frontmatter } = useData()
const apps = (frontmatter.value.apps ?? []) as AppMeta[]
</script>

<template>
  <h1 class="page-title">应用</h1>
  <p class="page-desc">{{ frontmatter.description || '浏览器里直接使用的小应用。' }}</p>

  <ul class="app-list">
    <li v-for="a in apps" :key="a.name" class="app-card">
      <a class="app-name" :href="withBase(a.path)">{{ a.name }} →</a>
      <p class="app-desc">{{ a.desc }}</p>
      <div v-if="a.tags?.length" class="app-tags">
        <span v-for="t in a.tags" :key="t" class="tag">#{{ t }}</span>
      </div>
    </li>
  </ul>

  <p v-if="!apps.length" class="empty">还没有应用，在 apps.md 的 frontmatter 中添加即可。</p>
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
.app-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 1rem;
}
.app-card {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  transition: border-color 0.2s;
}
.app-card:hover {
  border-color: var(--muted);
}
.app-name {
  font-weight: 600;
}
.app-name:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 1px;
}
.app-desc {
  margin: 0.5rem 0 0;
  color: var(--muted);
  font-size: 0.9375rem;
}
.app-tags {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.empty {
  color: var(--muted);
}
</style>

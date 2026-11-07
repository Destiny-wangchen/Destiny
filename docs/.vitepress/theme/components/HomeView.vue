<script setup lang="ts">
import { withBase, useData } from 'vitepress'
import { data as posts } from '../../posts.data'

const { frontmatter } = useData()
</script>

<template>
  <section class="intro">
    <h1 class="intro-title">{{ frontmatter.title }}</h1>
    <p class="intro-desc">{{ frontmatter.description }}</p>
  </section>

  <ul class="post-list">
    <li v-for="p in posts" :key="p.url" class="post-item">
      <a class="post-title" :href="withBase(p.url)">{{ p.title }}</a>
      <div class="post-meta">
        <span class="post-date">{{ p.date }}</span>
        <span v-for="t in p.tags" :key="t" class="tag">#{{ t }}</span>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.intro {
  padding: 3rem 0 2.5rem;
}
.intro-title {
  font-size: 1.625rem;
  margin: 0 0 0.5rem;
}
.intro-desc {
  color: var(--muted);
  margin: 0;
}
.post-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.post-item {
  padding: 1rem 0;
  border-bottom: 1px solid var(--border);
}
.post-item:last-child {
  border-bottom: none;
}
.post-title {
  font-weight: 500;
}
.post-title:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 1px;
}
.post-meta {
  margin-top: 0.25rem;
  color: var(--muted);
  font-size: 0.8125rem;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
</style>

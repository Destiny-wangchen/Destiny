<script setup lang="ts">
import { withBase, useData } from 'vitepress'
import { data as posts } from '../../posts.data'
import { seriesList } from '../../series'
import { simplifyDate } from '../formatDate'
import VerseStone from './VerseStone.vue'

const { frontmatter } = useData()
</script>

<template>
  <section class="intro">
    <h1 class="intro-title">{{ frontmatter.title }}</h1>
    <p class="intro-desc">{{ frontmatter.description }}</p>
  </section>

  <VerseStone />

  <section class="series">
    <h2 class="series-heading">系列</h2>
    <div class="series-list">
      <a v-for="s in seriesList" :key="s.name" class="series-card" :href="withBase(s.link)">
        <div class="series-top">
          <span class="series-name">{{ s.name }}</span>
          <span class="series-count">{{ s.items.length }} 篇</span>
        </div>
        <p class="series-desc">{{ s.desc }}</p>
      </a>
    </div>
  </section>

  <ul class="post-list">
    <li v-for="p in posts" :key="p.url" class="post-item">
      <a class="post-title" :href="withBase(p.url)">{{ p.title }}</a>
      <p v-if="p.description" class="post-desc">{{ p.description }}</p>
      <div class="post-meta">
        <span v-if="p.pinned" class="pin">置顶</span>
        <span class="post-date">{{ simplifyDate(p.date) }}</span>
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
.series {
  margin-bottom: 2.5rem;
}
.series-heading {
  font-size: 1rem;
  color: var(--muted);
  font-weight: 500;
  margin: 0 0 0.75rem;
}
.series-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
}
.series-card {
  display: block;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.875rem 1rem;
  transition: border-color 0.2s;
}
.series-card:hover {
  border-color: var(--fg);
}
.series-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}
.series-name {
  font-weight: 600;
}
.series-count {
  color: var(--muted);
  font-size: 0.75rem;
  white-space: nowrap;
}
.series-desc {
  margin: 0.375rem 0 0;
  color: var(--muted);
  font-size: 0.8125rem;
  line-height: 1.6;
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
.pin {
  color: var(--fg);
  font-size: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 0 0.4rem;
  line-height: 1.5;
}
.post-title {
  font-weight: 500;
}
.post-title:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 1px;
}
.post-desc {
  margin: 0.375rem 0 0;
  color: var(--muted);
  font-size: 0.875rem;
  line-height: 1.6;
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

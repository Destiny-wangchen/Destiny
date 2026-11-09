<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import ThemeToggle from './ThemeToggle.vue'
import FlowerLock from './FlowerLock.vue'
import { useGardenSecret } from '../useGardenSecret'

const { site } = useData()
const { unlocked } = useGardenSecret()

// 注意：链接统一带 .html，部分静态托管（如本站使用的平台）不做无扩展名映射
const baseNav = [
  { text: '首页', link: '/' },
  { text: '归档', link: '/archive.html' },
  { text: '项目', link: '/projects.html' },
  { text: '应用', link: '/apps.html' }
]

// 花锁未解锁时，「私密」入口不渲染，访客不可见
const nav = computed(() =>
  unlocked.value ? [...baseNav, { text: '私密', link: '/vault.html' }] : baseNav
)
</script>

<template>
  <header class="site-header">
    <div class="container header-inner">
      <div class="header-left">
        <a class="site-title" :href="withBase('/')">{{ site.title }}</a>
        <FlowerLock />
      </div>
      <nav class="nav">
        <a v-for="item in nav" :key="item.link" :href="withBase(item.link)">{{ item.text }}</a>
      </nav>
      <div class="header-actions">
        <a
          v-if="unlocked"
          class="icon-link"
          :href="withBase('/write.html')"
          title="写文章"
          aria-label="写文章"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
          </svg>
        </a>
        <a
          class="icon-link"
          href="https://github.com/Destiny-wangchen"
          target="_blank"
          rel="noopener"
          aria-label="GitHub"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"
            />
          </svg>
        </a>
        <ThemeToggle />
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  padding: 1.25rem 0;
}
.header-inner {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.site-title {
  font-weight: 600;
  letter-spacing: 0.02em;
}
.nav {
  display: flex;
  gap: 1rem;
  color: var(--muted);
  font-size: 0.9375rem;
}
.nav a:hover {
  color: var(--fg);
}
.header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.icon-link {
  display: inline-flex;
  color: var(--muted);
  padding: 4px;
}
.icon-link:hover {
  color: var(--fg);
}
</style>

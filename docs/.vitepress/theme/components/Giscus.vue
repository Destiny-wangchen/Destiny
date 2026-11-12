<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const box = ref<HTMLDivElement | null>(null)
let ob: MutationObserver | undefined

function theme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

// SPA 路由切换时组件会重新挂载，每次都按当前文章路径创建评论框
function create() {
  if (!box.value) return
  if (box.value.querySelector('iframe.giscus-frame')) return
  const s = document.createElement('script')
  s.src = 'https://giscus.app/client.js'
  s.async = true
  s.crossOrigin = 'anonymous'
  s.setAttribute('data-repo', 'Destiny-wangchen/Destiny')
  s.setAttribute('data-repo-id', 'R_kgDOVmIlwQ')
  s.setAttribute('data-category', 'Announcements')
  s.setAttribute('data-category-id', 'DIC_kwDOVmIlwc4DK7_-')
  s.setAttribute('data-mapping', 'pathname')
  s.setAttribute('data-strict', '0')
  s.setAttribute('data-reactions-enabled', '1')
  s.setAttribute('data-emit-metadata', '0')
  s.setAttribute('data-input-position', 'top')
  s.setAttribute('data-theme', theme())
  s.setAttribute('data-lang', 'zh-CN')
  box.value.appendChild(s)
}

onMounted(() => {
  create()
  // 跟随深色模式切换
  ob = new MutationObserver(() => {
    const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
    if (iframe) {
      iframe.contentWindow?.postMessage(
        { giscus: { setConfig: { theme: theme() } } },
        'https://giscus.app'
      )
    }
  })
  ob.observe(document.documentElement, { attributeFilter: ['class'] })
})

onBeforeUnmount(() => ob?.disconnect())
</script>

<template>
  <div class="giscus-wrap">
    <p class="giscus-title">留言</p>
    <div ref="box" class="giscus"></div>
  </div>
</template>

<style scoped>
.giscus-wrap {
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}
.giscus-title {
  margin: 0 0 1rem;
  color: var(--muted);
  font-size: 0.875rem;
}
</style>

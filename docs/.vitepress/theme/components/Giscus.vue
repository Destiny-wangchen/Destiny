<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useGardenSecret } from '../useGardenSecret'

// 花锁解锁 = 站长身份，显示评论管理入口
const { unlocked } = useGardenSecret()

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
  // 必须用 General：Announcements 分类只有管理员能开讨论，访客会发不了言
  s.setAttribute('data-category', 'General')
  s.setAttribute('data-category-id', 'DIC_kwDOVmIlwc4DK7__')
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
    <p class="giscus-title">
      留言
      <!-- 站长通道：花锁解锁后才可见，直达 Discussions 管理页 -->
      <a
        v-if="unlocked"
        class="giscus-admin"
        href="https://github.com/Destiny-wangchen/Destiny/discussions"
        target="_blank"
        rel="noopener"
      >管理评论 →</a>
    </p>
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
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.giscus-admin {
  color: var(--muted);
  font-size: 0.75rem;
}
.giscus-admin:hover {
  color: var(--fg);
}
</style>

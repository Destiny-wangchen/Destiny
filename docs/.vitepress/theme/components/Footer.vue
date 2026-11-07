<script setup lang="ts">
import { onMounted, watch, nextTick } from 'vue'
import { useRoute, withBase } from 'vitepress'
import { loadBusuanzi } from '../busuanzi'

const route = useRoute()
const year = new Date().getFullYear()

onMounted(() => loadBusuanzi())

watch(
  () => route.path,
  (path) => {
    // 只在进入文章页时刷新（阅读量需要按文章更新），
    // 站内其他跳转不重新计数，避免总访问量虚高
    if (/\/posts\//.test(path)) {
      nextTick(() => loadBusuanzi())
    }
  }
)
</script>

<template>
  <footer class="site-footer">
    <div class="container">
      <p class="footer-line">
        © {{ year }} Destiny · Powered by
        <a href="https://vitepress.dev" target="_blank" rel="noopener">VitePress</a>
      </p>
      <p class="footer-line stats">
        本站总访问量 <span id="busuanzi_value_site_pv">…</span> 次 · 访客数
        <span id="busuanzi_value_site_uv">…</span> 人
      </p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: 5rem;
  padding: 2rem 0 3rem;
  border-top: 1px solid var(--border);
  color: var(--muted);
  font-size: 0.8125rem;
  line-height: 1.8;
}
.footer-line {
  margin: 0;
}
</style>

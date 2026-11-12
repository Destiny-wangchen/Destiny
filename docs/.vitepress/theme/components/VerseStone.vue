<script setup lang="ts">
import { onMounted, ref } from 'vue'
import verses from '../../../verses.json'

interface Verse {
  text: string
  author: string
  from: string
}

const pool = (verses as { verses: Verse[] }).verses
// 客户端挂载后随机抽一句，避免 SSR 与浏览器渲染不一致
const current = ref<Verse | null>(null)

onMounted(() => {
  if (!pool.length) return
  current.value = pool[Math.floor(Math.random() * pool.length)]
})
</script>

<template>
  <template v-if="current">
    <!-- 大屏：左缘竖排石刻 -->
    <aside class="verse-stone" aria-hidden="false">
      <span class="stone-text">{{ current.text }}</span>
      <span class="stone-sign">—— {{ current.author }}{{ current.from }}</span>
    </aside>

    <!-- 小屏：横排一句，置于简介下方 -->
    <blockquote class="verse-inline">
      <p class="inline-text">{{ current.text }}</p>
      <p class="inline-sign">—— {{ current.author }}{{ current.from }}</p>
    </blockquote>
  </template>
</template>

<style scoped>
/* —— 大屏左缘竖排 —— */
.verse-stone {
  display: none;
}

@media (min-width: 1200px) {
  .verse-stone {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    position: fixed;
    left: clamp(1.5rem, 5vw, 4.5rem);
    top: 50%;
    transform: translateY(-50%);
    writing-mode: vertical-rl;
    text-orientation: upright;
    color: var(--muted);
    font-size: 0.8125rem;
    line-height: 1.9;
    letter-spacing: 0.3em;
    max-height: 62vh;
    opacity: 0;
    animation: stone-in 1.2s ease 0.3s forwards;
    pointer-events: none;
    user-select: none;
    z-index: 5;
  }
  .stone-text {
    opacity: 0.85;
  }
  .stone-sign {
    font-size: 0.6875rem;
    letter-spacing: 0.22em;
    opacity: 0.6;
  }
}

@keyframes stone-in {
  to {
    opacity: 1;
  }
}

/* —— 小屏横排 —— */
.verse-inline {
  display: block;
  margin: 0 0 2rem;
  padding: 0.9rem 1.1rem;
  border-left: 2px solid var(--border);
  color: var(--muted);
}

.verse-inline .inline-text {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.9;
}

.verse-inline .inline-sign {
  margin: 0.35rem 0 0;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  opacity: 0.8;
}

@media (min-width: 1200px) {
  .verse-inline {
    display: none;
  }
}
</style>

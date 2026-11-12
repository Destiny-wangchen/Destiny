<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import verses from '../../../verses.json'

interface Verse {
  text: string
  author: string
  from: string
}

const pool = (verses as { verses: Verse[] }).verses
// 客户端挂载后随机抽一句，避免 SSR 与浏览器渲染不一致
const current = ref<Verse | null>(null)
// 按标点切出的分句，一句一列
const clauses = ref<string[]>([])
// 兜底字号：正常情况下 13px 即可，仅未来出现超长分句时才收缩
const fs = ref(13)

/** 按中英文标点切分句，标点留在句尾 */
function splitClauses(text: string): string[] {
  const parts = text.match(/[^，。？！：；、,?!:;]+[，。？！：；、,?!:;]?/g)
  return (parts ?? [text]).map((s) => s.trim()).filter(Boolean)
}

function fit() {
  if (!clauses.value.length) return
  const longest = Math.max(...clauses.value.map((c) => c.length))
  const available = window.innerHeight * 0.86
  // 竖排每字约占 2.1 行高 + 0.18 字距，约合 2.28 倍字号
  fs.value = Math.max(10, Math.min(13, Math.floor(available / (longest * 2.28))))
}

function onResize() {
  fit()
}

onMounted(() => {
  if (!pool.length) return
  current.value = pool[Math.floor(Math.random() * pool.length)]
  clauses.value = splitClauses(current.value.text)
  fit()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => window.removeEventListener('resize', onResize))
</script>

<template>
  <template v-if="current">
    <!-- 大屏：左缘竖排石刻，按分句一句一列，自右向左排列 -->
    <aside class="verse-stone" :style="{ fontSize: fs + 'px' }" aria-hidden="true">
      <span v-for="(c, i) in clauses" :key="i" class="stone-col">{{ c }}</span>
      <span class="stone-col stone-sign">—— {{ current.author }}{{ current.from }}</span>
    </aside>

    <!-- 小屏：横排一句，置于简介下方 -->
    <blockquote class="verse-inline">
      <p class="inline-text">{{ current.text }}</p>
      <p class="inline-sign">—— {{ current.author }}{{ current.from }}</p>
    </blockquote>
  </template>
</template>

<style scoped>
/* —— 大屏左缘竖排：一句一列，列内不折行 —— */
.verse-stone {
  display: none;
}

@media (min-width: 1200px) {
  .verse-stone {
    display: flex;
    /* 竖排阅读自右向左，故主轴反向；首句落在最右 */
    flex-direction: row-reverse;
    align-items: flex-start;
    gap: 0.4em;
    position: fixed;
    left: clamp(1rem, 3vw, 2.5rem);
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted);
    opacity: 0;
    animation: stone-in 1.2s ease 0.3s forwards;
    pointer-events: none;
    user-select: none;
    z-index: 5;
  }

  .stone-col {
    writing-mode: vertical-rl;
    text-orientation: upright;
    white-space: nowrap;
    line-height: 2.1;
    letter-spacing: 0.18em;
    opacity: 0.85;
  }

  .stone-sign {
    align-self: flex-end;
    margin-right: 0.7em;
    font-size: 0.78em;
    letter-spacing: 0.14em;
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

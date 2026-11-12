<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import entries from '../../vault-data'
import { decryptEntry } from '../vault'
import { useGardenSecret } from '../useGardenSecret'

const { unlocked } = useGardenSecret()

// 与私密页共用同一把会话密码
const PW_KEY = 'garden-vault-pw'

const asking = ref(false)
const pw = ref('')
const err = ref('')
const busy = ref(false)
const title = ref('')
const clauses = ref<string[]>([])
const fs = ref(13)

function plain(md: string) {
  let t = md
  t = t.replace(/```[\s\S]*?```/g, ' ')
  t = t.replace(/`[^`]*`/g, ' ')
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  t = t.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  t = t.replace(/[#>*_~]/g, ' ')
  t = t.replace(/\s+/g, ' ').trim()
  return t
}

/** 按中英文标点切分句，一句一列，与左侧诗句石刻同款 */
function splitClauses(text: string): string[] {
  const parts = text.match(/[^，。？！：；、,?!:;]+[，。？！：；、,?!:;]?/g)
  return (parts ?? [text]).map((s) => s.trim()).filter(Boolean)
}

function fit() {
  if (!clauses.value.length) return
  const longest = Math.max(...clauses.value.map((c) => c.length))
  const available = window.innerHeight * 0.86
  fs.value = Math.max(10, Math.min(13, Math.floor(available / (longest * 2.28))))
}

function setExcerpt(payload: { title: string; body: string }) {
  const text = plain(payload.body)
  const excerpt = text.slice(0, 42) + (text.length > 42 ? '……' : '')
  title.value = payload.title
  clauses.value = splitClauses(excerpt)
  fit()
}

async function tryUnlock(pwVal: string, remember: boolean) {
  if (!entries.length) return
  busy.value = true
  err.value = ''
  // 只取最新一篇作为右侧石刻内容
  const latest = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0]
  try {
    const payload = await decryptEntry(latest, pwVal)
    if (remember) sessionStorage.setItem(PW_KEY, pwVal)
    setExcerpt(payload)
    asking.value = false
  } catch {
    err.value = '密码不对'
    asking.value = true
  } finally {
    busy.value = false
  }
}

function submit() {
  if (pw.value) tryUnlock(pw.value, true)
}

function onResize() {
  fit()
}

function activate() {
  const saved = sessionStorage.getItem(PW_KEY)
  if (saved) tryUnlock(saved, false)
  else asking.value = true
}

function deactivate() {
  clauses.value = []
  asking.value = false
  err.value = ''
  pw.value = ''
  busy.value = false
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  if (unlocked.value) activate()
})

// 花锁解锁立即出现；重新上锁立即消失
watch(unlocked, (v) => {
  if (v) activate()
  else deactivate()
})

onBeforeUnmount(() => window.removeEventListener('resize', onResize))
</script>

<template>
  <aside v-if="unlocked && (clauses.length || asking)" class="secret-stone">
    <template v-if="clauses.length">
      <span v-for="(c, i) in clauses" :key="i" class="stone-col">{{ c }}</span>
      <span class="stone-col stone-sign" :style="{ fontSize: fs * 0.78 + 'px' }">—— {{ title }}</span>
    </template>

    <template v-else>
      <span class="stone-col stone-label" :style="{ fontSize: fs + 'px' }">密文待启</span>
      <div class="pw-box">
        <input
          v-model="pw"
          class="pw-input"
          type="password"
          placeholder="输入密码"
          :disabled="busy"
          @keyup.enter="submit"
        />
        <p v-if="err" class="pw-err">{{ err }}</p>
        <p class="pw-hint">输对后此处常显密文摘句</p>
      </div>
    </template>
  </aside>
</template>

<style scoped>
/* —— 右缘竖排石刻：与左侧诗句对称，仅花锁解锁后出现 —— */
.secret-stone {
  display: none;
}

@media (min-width: 1200px) {
  .secret-stone {
    display: flex;
    /* 首句贴右缘，后续列自右向左展开 */
    flex-direction: row-reverse;
    align-items: flex-start;
    gap: 0.4em;
    position: fixed;
    right: clamp(1rem, 3vw, 2.5rem);
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted);
    opacity: 0;
    animation: stone-in 1.2s ease 0.3s forwards;
    z-index: 5;
  }

  .stone-col {
    writing-mode: vertical-rl;
    text-orientation: upright;
    white-space: nowrap;
    line-height: 2.1;
    letter-spacing: 0.18em;
    opacity: 0.85;
    user-select: none;
    pointer-events: none;
  }

  .stone-sign {
    align-self: flex-end;
    margin-left: 0.7em;
    letter-spacing: 0.14em;
    opacity: 0.6;
  }

  .stone-label {
    opacity: 0.55;
  }

  /* 竖排之间的密码框保持横排（竖排输入框没法用） */
  .pw-box {
    writing-mode: horizontal-tb;
    margin-right: 0.6em;
    display: grid;
    gap: 0.4rem;
    justify-items: start;
  }

  .pw-input {
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    color: var(--fg);
    padding: 0.3rem 0.6rem;
    font-size: 0.8125rem;
    font-family: inherit;
    width: 9rem;
    outline: none;
  }

  .pw-input:focus {
    border-color: var(--muted);
  }

  .pw-err {
    margin: 0;
    color: #c0392b;
    font-size: 0.6875rem;
  }

  .pw-hint {
    margin: 0;
    color: var(--muted);
    font-size: 0.6875rem;
    opacity: 0.7;
  }
}

@keyframes stone-in {
  to {
    opacity: 1;
  }
}

@media (max-width: 1199px) {
  .secret-stone {
    display: none;
  }
}
</style>

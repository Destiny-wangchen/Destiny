<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { marked } from 'marked'
import entries from '../../vault-data'
import { decryptEntry, isPlainEntry, type VaultEntry, type VaultPayload } from '../vault'
import { simplifyDate } from '../formatDate'

interface Item extends VaultPayload {
  date: string
  html: string
}

const password = ref('')
const error = ref('')
const busy = ref(false)
const secretItems = ref<Item[]>([])
const openIndex = ref(0)

const STORAGE_KEY = 'garden-vault-pw'

function render(body: string) {
  return marked.parse(body, { gfm: true, breaks: true }) as string
}

function toItem(payload: VaultPayload, date: string): Item {
  return { ...payload, date, html: render(payload.body) }
}

// 免密条目：无需密码，进页即读
const plainItems = ref<Item[]>(
  entries.filter(isPlainEntry).map((e) => toItem(e.payload, e.date))
)

// 加密条目：需要密码解锁
const secretEntries = entries.filter((e) => !isPlainEntry(e)) as VaultEntry[]
const secretCount = secretEntries.length

// 没有加密内容时视为「已解锁」，不出现密码框
const unlocked = ref(secretCount === 0)

// 展示列表 = 免密 + 已解锁的加密，按日期倒序
const displayItems = computed(() =>
  [...plainItems.value, ...secretItems.value].sort((a, b) => b.date.localeCompare(a.date))
)

async function unlock(pw: string) {
  if (!pw) {
    error.value = '请输入密码'
    return
  }
  busy.value = true
  error.value = ''
  const list: Item[] = []
  const failed: VaultEntry[] = []

  for (const entry of secretEntries) {
    try {
      const payload = await decryptEntry(entry, pw)
      list.push(toItem(payload, entry.date))
    } catch {
      failed.push(entry)
    }
  }

  busy.value = false

  if (!list.length) {
    error.value = '密码不对，或者这些内容不是用同一个密码加密的'
    return
  }

  secretItems.value = list
  unlocked.value = true
  openIndex.value = 0
  sessionStorage.setItem(STORAGE_KEY, pw)
  if (failed.length) error.value = `有 ${failed.length} 篇的密码不一致，未能打开`
}

function lock() {
  password.value = ''
  secretItems.value = []
  unlocked.value = secretCount === 0
  openIndex.value = 0
  sessionStorage.removeItem(STORAGE_KEY)
}

function toggle(i: number) {
  openIndex.value = i
}

const noCrypto = ref(false)

onMounted(() => {
  if (secretCount && !(window.crypto && window.crypto.subtle)) {
    noCrypto.value = true
    return
  }
  const saved = sessionStorage.getItem(STORAGE_KEY)
  if (saved && secretCount) unlock(saved)
})
</script>

<template>
  <h1 class="page-title">密文</h1>
  <p class="page-desc">只有拿得到密码的人才打得开。内容在本地解密，服务端只存密文。</p>

  <p v-if="!entries.length" class="empty">
    还没有私密文章。把 <code>.md</code> 放进 <code>private-src/</code>，然后运行
    <code>npm run lock</code>。
  </p>

  <!-- 有加密内容且未解锁时才出现密码框 -->
  <form v-if="secretCount && !unlocked" class="unlock" @submit.prevent="unlock(password)">
    <input
      v-model="password"
      type="password"
      class="pw-input"
      placeholder="输入密码，解锁加密文章"
      autocomplete="current-password"
    />
    <button class="btn" type="submit" :disabled="busy">
      {{ busy ? '解锁中…' : '解锁' }}
    </button>
  </form>

  <p v-if="noCrypto" class="error">
    当前环境不支持浏览器解密（需要 https 或 localhost 打开），请换用安全的连接访问。
  </p>

  <p v-if="error" class="error">{{ error }}</p>

  <template v-if="displayItems.length">
    <div class="vault-bar">
      <span>{{ displayItems.length }} 篇<template v-if="secretCount && !unlocked">（免密）</template></span>
      <button v-if="secretCount && unlocked" class="btn ghost" type="button" @click="lock">锁定</button>
    </div>

    <div class="vault-layout">
      <!-- 左：文章列表 -->
      <nav class="vault-list">
        <button
          v-for="(item, i) in displayItems"
          :key="i"
          class="vault-head"
          :class="{ active: openIndex === i }"
          type="button"
          @click="toggle(i)"
        >
          <span class="vault-title">{{ item.title }}</span>
          <span class="vault-date">{{ simplifyDate(item.date) }}</span>
        </button>
      </nav>

      <!-- 右：当前文章完整正文，横排正常换行 -->
      <div v-if="displayItems[openIndex]" class="vault-reader">
        <div class="reader-head">
          <span class="reader-title">{{ displayItems[openIndex].title }}</span>
          <span class="reader-meta">
            <span class="vault-date">{{ simplifyDate(displayItems[openIndex].date) }}</span>
            <span v-for="t in displayItems[openIndex].tags" :key="t" class="tag">#{{ t }}</span>
          </span>
        </div>
        <div class="vault-body post-content" v-html="displayItems[openIndex].html"></div>
      </div>
    </div>
  </template>
  <p v-else-if="secretCount && !unlocked" class="hint-empty">
    还有 {{ secretCount }} 篇加密文章，输入上方密码后出现。
  </p>
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
.empty {
  color: var(--muted);
}
.unlock {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.pw-input {
  flex: 1;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--fg);
  font-size: 0.9375rem;
  outline: none;
}
.pw-input:focus {
  border-color: var(--muted);
}
.btn {
  padding: 0.55rem 1.1rem;
  border: 1px solid var(--fg);
  border-radius: 6px;
  background: var(--fg);
  color: var(--bg);
  font-size: 0.875rem;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.6;
  cursor: default;
}
.btn.ghost {
  background: none;
  color: var(--muted);
  border-color: var(--border);
  padding: 0.25rem 0.7rem;
}
.btn.ghost:hover {
  color: var(--fg);
}
.error {
  color: #c0392b;
  font-size: 0.875rem;
  margin: 0 0 1rem;
}
.hint-empty {
  color: var(--muted);
  font-size: 0.875rem;
}
.vault-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--muted);
  font-size: 0.8125rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.6rem;
  margin-bottom: 0.5rem;
}
/* —— 左列表 + 右正文 —— */
.vault-layout {
  display: grid;
  grid-template-columns: minmax(180px, 260px) 1fr;
  gap: 2rem;
  align-items: start;
}
@media (max-width: 720px) {
  .vault-layout {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
}
.vault-list {
  display: grid;
  border-top: 1px solid var(--border);
}
.vault-head {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.8rem 0.6rem;
  border: none;
  border-bottom: 1px solid var(--border);
  background: none;
  color: var(--muted);
  font-size: 0.9375rem;
  text-align: left;
  cursor: pointer;
  transition: color 0.2s, background 0.2s;
}
.vault-head:hover {
  color: var(--fg);
}
.vault-head.active {
  color: var(--fg);
  background: var(--code-bg);
}
.vault-title {
  font-weight: 500;
}
.vault-head.active .vault-title {
  font-weight: 600;
}
.vault-date {
  color: var(--muted);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}
.reader-head {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  flex-wrap: wrap;
  padding-bottom: 0.8rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid var(--border);
}
.reader-title {
  font-size: 1.125rem;
  font-weight: 600;
}
.reader-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.vault-body {
  /* 横排正文：默认换行行为，长词/网址也能正常折行 */
  padding: 0;
  overflow-wrap: break-word;
  line-height: 1.9;
}
</style>

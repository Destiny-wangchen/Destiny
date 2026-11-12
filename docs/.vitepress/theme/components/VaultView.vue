<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { marked } from 'marked'
import entries from '../../vault-data'
import { decryptEntry, type VaultEntry, type VaultPayload } from '../vault'
import { simplifyDate } from '../formatDate'

interface Item extends VaultPayload {
  date: string
  html: string
}

const password = ref('')
const error = ref('')
const busy = ref(false)
const unlocked = ref(false)
const items = ref<Item[]>([])
const openIndex = ref(-1)

const STORAGE_KEY = 'garden-vault-pw'

function render(body: string) {
  return marked.parse(body, { gfm: true, breaks: true }) as string
}

async function unlock(pw: string) {
  if (!pw) {
    error.value = '请输入密码'
    return
  }
  busy.value = true
  error.value = ''
  const list: Item[] = []
  const failed: VaultEntry[] = []

  for (const entry of entries) {
    try {
      const payload = await decryptEntry(entry, pw)
      list.push({ ...payload, date: entry.date, html: render(payload.body) })
    } catch {
      failed.push(entry)
    }
  }

  busy.value = false

  if (!list.length) {
    error.value = '密码不对，或者这些内容不是用同一个密码加密的'
    return
  }

  list.sort((a, b) => b.date.localeCompare(a.date))
  items.value = list
  unlocked.value = true
  openIndex.value = 0
  sessionStorage.setItem(STORAGE_KEY, pw)
  if (failed.length) error.value = `有 ${failed.length} 篇的密码不一致，未能打开`
}

function lock() {
  password.value = ''
  items.value = []
  unlocked.value = false
  openIndex.value = -1
  sessionStorage.removeItem(STORAGE_KEY)
}

function toggle(i: number) {
  openIndex.value = openIndex.value === i ? -1 : i
}

const noCrypto = ref(false)

onMounted(() => {
  if (!(window.crypto && window.crypto.subtle)) {
    noCrypto.value = true
    return
  }
  const saved = sessionStorage.getItem(STORAGE_KEY)
  if (saved && entries.length) unlock(saved)
})
</script>

<template>
  <h1 class="page-title">密文</h1>
  <p class="page-desc">只有拿得到密码的人才打得开。内容在本地解密，服务端只存密文。</p>

  <p v-if="!entries.length" class="empty">
    还没有私密文章。把 <code>.md</code> 放进 <code>private-src/</code>，然后运行
    <code>npm run lock</code>。
  </p>

  <form v-else-if="!unlocked" class="unlock" @submit.prevent="unlock(password)">
    <input
      v-model="password"
      type="password"
      class="pw-input"
      placeholder="输入密码"
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

  <template v-if="unlocked">
    <div class="vault-bar">
      <span>{{ items.length }} 篇</span>
      <button class="btn ghost" type="button" @click="lock">锁定</button>
    </div>

    <article v-for="(item, i) in items" :key="i" class="vault-item">
      <button class="vault-head" type="button" @click="toggle(i)">
        <span class="vault-title">{{ item.title }}</span>
        <span class="vault-date">{{ simplifyDate(item.date) }}</span>
      </button>
      <div v-if="openIndex === i" class="vault-body post-content" v-html="item.html"></div>
      <div v-if="openIndex === i && item.tags.length" class="vault-tags">
        <span v-for="t in item.tags" :key="t" class="tag">#{{ t }}</span>
      </div>
    </article>
  </template>
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
.vault-item {
  border-bottom: 1px solid var(--border);
}
.vault-head {
  width: 100%;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 0;
  border: none;
  background: none;
  color: var(--fg);
  font-size: 1rem;
  text-align: left;
  cursor: pointer;
}
.vault-title {
  font-weight: 500;
}
.vault-head:hover .vault-title {
  text-decoration: underline;
  text-underline-offset: 4px;
}
.vault-date {
  color: var(--muted);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}
.vault-body {
  padding: 0.5rem 0 1.5rem;
}
.vault-tags {
  display: flex;
  gap: 0.5rem;
  padding-bottom: 1.5rem;
}
</style>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { marked } from 'marked'
import entries from '../../vault-data'
import { decryptEntry, isEggEntry, isPlainEntry, EGG_KEY, EGG_FLAG, type VaultEntry, type VaultPayload } from '../vault'
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

// 加密条目：需要密码解锁（排除免密与彩蛋）
const secretEntries = entries.filter((e) => !isPlainEntry(e) && !isEggEntry(e)) as VaultEntry[]

// 彩蛋条目：首页诗句署名点中「博尔赫斯」后解锁（会话级）
const eggEntries = entries.filter(isEggEntry)
const eggOpen = ref(sessionStorage.getItem(EGG_FLAG) === '1')
const eggItems = ref<Item[]>([])
const secretCount = secretEntries.length

// 没有加密内容时视为「已解锁」，不出现密码框
const unlocked = ref(secretCount === 0)

// 展示列表 = 免密 + 已触发的彩蛋 + 已解锁的加密，按日期倒序
const displayItems = computed(() =>
  [...plainItems.value, ...(eggOpen.value ? eggItems.value : []), ...secretItems.value].sort(
    (a, b) => b.date.localeCompare(a.date)
  )
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

// 解锁后出现在左缘的引路话（横排，按原分行）
const introLines = [
  '如果你能看到这句话',
  '那么',
  '要么你对我足够了解',
  '要么我对你足够信任',
  '虽说也不是什么重要的文字',
  '但我还是希望',
  '有些浪漫和真挚的话可以留给你',
  '那',
  '去寻找我的密码吧',
  '去看看',
  '我想说却没有说出来的话'
]

const noCrypto = ref(false)

onMounted(() => {
  // 彩蛋已触发：解出彩蛋文章
  if (eggOpen.value && eggEntries.length && window.crypto && window.crypto.subtle) {
    Promise.all(
      eggEntries.map(async (entry) => {
        try {
          const payload = await decryptEntry(entry, EGG_KEY)
          eggItems.value.push(toItem(payload, entry.date))
        } catch {
          /* 混淆密钥不匹配则忽略 */
        }
      })
    )
  }
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

  <!-- 解锁后（密码或彩蛋任一）：左缘引路话（与首页诗句石刻同位置，横排分行） -->
  <aside v-if="unlocked || eggOpen" class="vault-intro">
    <p v-for="(l, i) in introLines" :key="i">{{ l }}</p>
  </aside>

  <p v-if="!entries.length" class="empty">
    还没有私密文章。把 <code>.md</code> 放进 <code>private-src/</code>，然后运行
    <code>npm run lock</code>。
  </p>

  <p v-if="noCrypto" class="error">
    当前环境不支持浏览器解密（需要 https 或 localhost 打开），请换用安全的连接访问。
  </p>

  <template v-if="displayItems.length || secretCount">
    <div class="vault-bar">
      <span>{{ displayItems.length }} 篇<template v-if="secretCount && !unlocked">（另有 {{ secretCount }} 篇待密钥解锁）</template></span>
    </div>

    <div class="vault-layout">
      <!-- 左：文章列表 + 常驻密钥输入区 -->
      <div class="vault-side">
        <nav v-if="displayItems.length" class="vault-list">
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
        <p v-else class="hint-empty">
          还有 {{ secretCount }} 篇加密文章，输入密钥后出现。
        </p>

        <!-- 密钥输入区：常驻，与彩蛋解锁互不影响 -->
        <div v-if="secretCount" class="key-box">
          <p class="key-label">密钥 · 解锁 {{ secretCount }} 篇加密文章</p>
          <form v-if="!unlocked" class="unlock" @submit.prevent="unlock(password)">
            <input
              v-model="password"
              type="password"
              class="pw-input"
              placeholder="输入密钥"
              autocomplete="current-password"
            />
            <button class="btn" type="submit" :disabled="busy">
              {{ busy ? '解锁中…' : '解锁' }}
            </button>
          </form>
          <div v-else class="key-status">
            <span class="key-ok">已解锁</span>
            <button class="btn ghost" type="button" @click="lock">锁定</button>
          </div>
          <p v-if="error" class="error">{{ error }}</p>
          <p v-if="eggOpen && eggItems.length" class="key-egg">彩蛋已开启 · {{ eggItems.length }} 篇</p>
        </div>
      </div>

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
/* —— 解锁后左缘引路话：贴屏幕左缘，横排分行 —— */
.vault-intro {
  display: none;
}
@media (min-width: 1200px) {
  .vault-intro {
    display: block;
    position: fixed;
    left: clamp(1.25rem, 3.5vw, 3rem);
    top: 50%;
    transform: translateY(-50%);
    /* 13 字长句 + 字距可整行放下，按原有分句一行一句 */
    max-width: 13.5rem;
    color: var(--muted);
    font-size: 0.75rem;
    line-height: 2;
    letter-spacing: 0.06em;
    opacity: 0;
    animation: intro-in 1.2s ease 0.2s forwards;
    pointer-events: none;
    user-select: none;
    z-index: 5;
  }
  .vault-intro p {
    margin: 0;
  }
}
@keyframes intro-in {
  to {
    opacity: 0.75;
  }
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
/* —— 左栏（列表 + 密钥区）—— */
.vault-side {
  display: grid;
  gap: 1rem;
  align-content: start;
}
.key-box {
  padding: 0.75rem 0.85rem;
  border: 1px dashed var(--border);
  border-radius: 8px;
  display: grid;
  gap: 0.5rem;
}
.key-label {
  margin: 0;
  color: var(--muted);
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}
.key-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.key-ok {
  color: var(--fg);
  font-size: 0.8125rem;
}
.key-egg {
  margin: 0;
  color: var(--muted);
  font-size: 0.6875rem;
}
.key-box .unlock {
  margin-bottom: 0;
}
.key-box .error {
  margin: 0;
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

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { marked } from 'marked'

const title = ref('')
const date = ref('')
const tags = ref('')
const body = ref('')
const isPrivate = ref(false)
const slug = ref('')
const slugTouched = ref(false)
const copied = ref(false)
const showPreview = ref(false)

const DRAFT_KEY = 'garden-write-draft'
const TOKEN_KEY = 'garden-gh-token'
const REPO = 'Destiny-wangchen/Destiny'
const ACTIONS_URL = 'https://github.com/Destiny-wangchen/Destiny/actions'
const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new'

// —— 发布相关 ——
const token = ref('')
const showToken = ref(false)
const vaultPw = ref('')
const publishing = ref(false)
const pubMsg = ref('')
const pubErr = ref('')
const pubOk = ref(false)

function today() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function suggestSlug(t: string) {
  const ascii = t
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const hasAscii = /[a-z0-9]/.test(ascii)
  if (hasAscii) return ascii.slice(0, 60)
  const d = date.value || today()
  return `note-${d.replace(/-/g, '')}`
}

const tagList = computed(() =>
  tags.value
    .split(/[,，\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
)

const frontmatter = computed(() => {
  const lines = ['---', `title: ${title.value || '未命名'}`, `date: ${date.value || today()}`]
  if (tagList.value.length) {
    lines.push('tags:')
    tagList.value.forEach((t) => lines.push(`  - ${t}`))
  }
  lines.push('---', '')
  return lines.join('\n')
})

const markdown = computed(() => `${frontmatter.value}\n${body.value.trim()}\n`)

const previewHtml = computed(() =>
  body.value.trim()
    ? (marked.parse(body.value, { gfm: true, breaks: true }) as string)
    : '<p class="placeholder">正文会在这里预览。</p>'
)

const fileName = computed(() => `${(slug.value || suggestSlug(title.value) || 'post').replace(/\.md$/, '')}.md`)
const fileId = computed(() => fileName.value.replace(/\.md$/, ''))

const ready = computed(() => title.value.trim().length > 0 && body.value.trim().length > 0)

watch(title, (t) => {
  if (!slugTouched.value) slug.value = suggestSlug(t)
})
watch(date, () => {
  if (!slugTouched.value) slug.value = suggestSlug(title.value)
})
watch([title, date, tags, body, isPrivate], () => {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ title: title.value, date: date.value, tags: tags.value, body: body.value, isPrivate: isPrivate.value })
    )
  } catch {
    /* ignore */
  }
})

watch(token, (t) => {
  try {
    localStorage.setItem(TOKEN_KEY, t.trim())
  } catch {
    /* ignore */
  }
})

onMounted(() => {
  date.value = today()
  try {
    token.value = localStorage.getItem(TOKEN_KEY) || ''
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) {
      const d = JSON.parse(raw)
      title.value = d.title || ''
      date.value = d.date || today()
      tags.value = d.tags || ''
      body.value = d.body || ''
      isPrivate.value = !!d.isPrivate
      slug.value = suggestSlug(title.value)
    }
  } catch {
    /* ignore */
  }
})

async function copy() {
  try {
    await navigator.clipboard.writeText(markdown.value)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = markdown.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
  copied.value = true
  setTimeout(() => (copied.value = false), 1600)
}

function download() {
  const blob = new Blob([markdown.value], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.value
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function reset() {
  if (!confirm('清空当前草稿？')) return
  title.value = ''
  date.value = today()
  tags.value = ''
  body.value = ''
  isPrivate.value = false
  slug.value = ''
  slugTouched.value = false
  localStorage.removeItem(DRAFT_KEY)
}
// —— 一键发布实现 ——

function b64encode(str: string) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin)
}

async function ghPut(path: string, content: string, message: string) {
  const headers = {
    Authorization: `Bearer ${token.value.trim()}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json'
  }
  // 更新已有文件需要带上 sha
  let sha: string | undefined
  const get = await fetch(`https://api.github.com/repos/${REPO}/contents/${encodeURI(path)}?ref=main`, { headers })
  if (get.ok) sha = (await get.json()).sha
  else if (get.status !== 404) throw new Error(`GitHub API ${get.status}，请检查 Token 权限`)

  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${encodeURI(path)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ message, content: b64encode(content), branch: 'main', ...(sha ? { sha } : {}) })
  })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}) as { message?: string })
    throw new Error(`GitHub API ${res.status}: ${j.message ?? '未知错误'}`)
  }
}

// 与主题 vault.ts 的解密逻辑完全对应（PBKDF2 + AES-GCM，浏览器端加密）
async function encryptForVault(payload: object, pw: string) {
  const enc = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(payload)))
  const toB64 = (buf: ArrayBuffer | Uint8Array) => {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
    let bin = ''
    bytes.forEach((b) => (bin += String.fromCharCode(b)))
    return btoa(bin)
  }
  return { salt: toB64(salt), iv: toB64(iv), ct: toB64(ct), iter: 200000 }
}

async function publish() {
  pubMsg.value = ''
  pubErr.value = ''
  pubOk.value = false

  if (!ready.value) return
  if (!token.value.trim()) {
    pubErr.value = '请先填写 GitHub Token（只需要填一次，会保存在这台设备上）'
    return
  }
  if (isPrivate.value && !vaultPw.value) {
    pubErr.value = '隐藏文章需要填写保险箱密码，访客将用它来解锁'
    return
  }

  publishing.value = true
  try {
    if (isPrivate.value) {
      // 正文在浏览器本地加密，仓库与服务器只会拿到密文
      const payload = { title: title.value.trim(), tags: tagList.value, body: '\n' + body.value.trim() + '\n' }
      const enc = await encryptForVault(payload, vaultPw.value)
      const entry = { id: fileId.value, date: date.value || today(), ...enc }
      await ghPut(`private-vault/${fileId.value}.json`, JSON.stringify(entry, null, 2), `publish(加密): ${title.value.trim()}`)
      pubMsg.value = `加密发布成功！「${title.value.trim()}」将在 1-2 分钟后出现在「私密」页，输入保险箱密码即可查看。`
    } else {
      await ghPut(`docs/posts/${fileName.value}`, markdown.value, `publish: ${title.value.trim()}`)
      pubMsg.value = `发布成功！「${title.value.trim()}」将在 1-2 分钟后出现在首页和归档。`
    }
    pubOk.value = true
  } catch (e) {
    pubErr.value = e instanceof Error ? e.message : String(e)
  } finally {
    publishing.value = false
  }
}
</script>
<template>
  <h1 class="page-title">写文章</h1>
  <p class="page-desc">
    写完点「一键发布」即可自动上线，草稿会自动存在这台设备的浏览器里。
  </p>

  <div class="field">
    <label>标题</label>
    <input v-model="title" type="text" class="input" placeholder="今天想写点什么" />
  </div>

  <div class="row">
    <div class="field">
      <label>日期</label>
      <input v-model="date" type="date" class="input" />
    </div>
    <div class="field">
      <label>标签（逗号或空格分隔）</label>
      <input v-model="tags" type="text" class="input" placeholder="随笔 技术" />
    </div>
  </div>

  <div class="field">
    <label>文件名</label>
    <input
      v-model="slug"
      type="text"
      class="input mono"
      placeholder="my-post"
      @input="slugTouched = true"
    />
    <p class="hint">会成为 URL：<code>/posts/{{ fileId }}</code></p>
  </div>

  <div class="field">
    <label class="check">
      <input v-model="isPrivate" type="checkbox" />
      <span>隐藏文章（不进入公开列表，访客需密码才能查看）</span>
    </label>
    <p v-if="isPrivate" class="hint">
      勾选后正文会在你的浏览器里用下面的保险箱密码加密，然后再上传——仓库里只有密文，
      拿到密码的人在「<a class="inline-link" href="/Destiny/vault.html">私密</a>」页输入同一密码即可阅读。
      想让谁看，就把密码给谁。
    </p>
  </div>

  <div v-if="isPrivate" class="field">
    <label>保险箱密码（加密用，发布后把同一密码告诉可查看的人）</label>
    <input
      v-model="vaultPw"
      type="password"
      class="input"
      placeholder="与「私密」页解锁密码一致"
      autocomplete="off"
    />
  </div>

  <div class="field">
    <div class="label-row">
      <label>正文（Markdown）</label>
      <div class="mini-actions">
        <button class="text-btn" type="button" @click="showPreview = !showPreview">
          {{ showPreview ? '收起预览' : '预览' }}
        </button>
        <button class="text-btn" type="button" @click="reset">清空</button>
      </div>
    </div>
    <textarea v-model="body" class="textarea" rows="14" placeholder="# 小标题&#10;&#10;从这里开始写。"></textarea>
  </div>

  <div v-if="showPreview" class="preview post-content" v-html="previewHtml"></div>

  <div class="publish-box">
    <div class="field token-field">
      <label>
        GitHub Token（一键发布用，只需填一次）
        <button class="text-btn" type="button" @click="showToken = !showToken">
          {{ showToken ? '隐藏' : '显示' }}
        </button>
      </label>
      <input
        v-model="token"
        :type="showToken ? 'text' : 'password'"
        class="input mono"
        placeholder="github_pat_… 或 ghp_…"
        autocomplete="off"
      />
      <p class="hint">
        在 <a class="inline-link" :href="TOKEN_URL" target="_blank" rel="noopener">GitHub Token 设置页</a>
        创建：Repository access 选 <strong>Only select repositories → Destiny</strong>，
        Permissions 给 <strong>Contents: Read and write</strong>。
        Token 只保存在你自己的浏览器里，不会进入仓库。
      </p>
    </div>

    <div class="actions">
      <button class="btn publish" type="button" :disabled="!ready || publishing" @click="publish">
        {{ publishing ? '发布中…' : isPrivate ? '一键发布（加密）' : '一键发布' }}
      </button>
      <button class="btn ghost" type="button" :disabled="!ready" @click="download">
        下载 {{ fileName }}
      </button>
      <button class="btn ghost" type="button" :disabled="!ready" @click="copy">
        {{ copied ? '已复制' : '复制 Markdown' }}
      </button>
    </div>

    <p v-if="pubOk && pubMsg" class="pub-ok">
      {{ pubMsg }}
      <a class="inline-link" :href="ACTIONS_URL" target="_blank" rel="noopener">查看构建进度 ↗</a>
    </p>
    <p v-else-if="pubMsg" class="pub-ok">{{ pubMsg }}</p>
    <p v-if="pubErr" class="pub-err">{{ pubErr }}</p>
  </div>

  <div class="howto">
    <p>
      <strong>公开文章</strong>：点「一键发布」，自动进入首页、归档，对所有人可见。
    </p>
    <p>
      <strong>隐藏文章</strong>：勾选「隐藏文章」并填写保险箱密码后点「一键发布」。
      内容加密后才离开你的浏览器，不进入公开列表；拿到密码的人在「
      <a class="inline-link" href="/Destiny/vault.html">私密</a>」页输入同一密码即可查看。
    </p>
  </div>
</template>
<style scoped>
.page-title {
  margin: 2.5rem 0 0.5rem;
  font-size: 1.5rem;
}
.page-desc {
  color: var(--muted);
  margin: 0 0 2rem;
  font-size: 0.9375rem;
}
.field {
  margin-bottom: 1.1rem;
}
.field > label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8125rem;
  color: var(--muted);
  margin-bottom: 0.35rem;
}
.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.label-row label {
  flex: 1;
}
.mini-actions {
  display: flex;
  gap: 0.75rem;
}
.text-btn {
  border: none;
  background: none;
  color: var(--muted);
  font-size: 0.8125rem;
  cursor: pointer;
  padding: 0;
}
.text-btn:hover {
  color: var(--fg);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.input,
.textarea {
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--fg);
  font-size: 0.9375rem;
  font-family: inherit;
  outline: none;
}
.input:focus,
.textarea:focus {
  border-color: var(--muted);
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.875rem;
}
.textarea {
  resize: vertical;
  line-height: 1.7;
}
.hint {
  margin: 0.35rem 0 0;
  font-size: 0.75rem;
  color: var(--muted);
  line-height: 1.8;
}
.inline-link {
  text-decoration: underline;
  text-decoration-color: var(--muted);
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}
.inline-link:hover {
  text-decoration-color: var(--fg);
}
.check {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  color: var(--fg) !important;
  cursor: pointer;
}
.preview {
  border: 1px dashed var(--border);
  border-radius: 8px;
  padding: 0 1.25rem;
  margin-bottom: 1.25rem;
}
.preview :deep(.placeholder) {
  color: var(--muted);
}
.publish-box {
  border-top: 1px solid var(--border);
  padding-top: 1.25rem;
  margin-top: 0.5rem;
}
.actions {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
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
  opacity: 0.45;
  cursor: default;
}
.btn.publish {
  min-width: 9rem;
}
.btn.ghost {
  background: none;
  color: var(--fg);
  border-color: var(--border);
}
.btn.ghost:hover:not(:disabled) {
  border-color: var(--muted);
}
.pub-ok {
  margin: 0.9rem 0 0;
  color: var(--fg);
  font-size: 0.875rem;
  background: var(--code-bg);
  border-radius: 6px;
  padding: 0.6rem 0.9rem;
}
.pub-err {
  margin: 0.9rem 0 0;
  color: #c0392b;
  font-size: 0.875rem;
}
.howto {
  margin-top: 1.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
  color: var(--muted);
  font-size: 0.8125rem;
  line-height: 1.9;
}
.howto p {
  margin: 0 0 0.5rem;
}
@media (max-width: 560px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>

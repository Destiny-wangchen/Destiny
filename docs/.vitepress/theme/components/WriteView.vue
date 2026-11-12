<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { marked } from 'marked'
import { EGG_KEY } from '../vault'

const title = ref('')
const date = ref('')
const tags = ref('')
const body = ref('')
const isPrivate = ref(false)
const isPinned = ref(false)
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
const showTokenField = ref(false)
const hasToken = computed(() => !!token.value.trim())
const vaultPw = ref('')
// 隐藏文章解锁方式：无需密码 / 保险箱密码 / 博尔赫斯彩蛋
const unlockMode = ref<'open' | 'pw' | 'egg'>('open')
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
  if (isPinned.value) lines.push('pinned: true')
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
watch([title, date, tags, body, isPrivate, isPinned], () => {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ title: title.value, date: date.value, tags: tags.value, body: body.value, isPrivate: isPrivate.value, isPinned: isPinned.value })
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
      isPinned.value = !!d.isPinned
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
  isPinned.value = false
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
  if (isPrivate.value && unlockMode.value === 'pw' && !vaultPw.value) {
    pubErr.value = '解锁方式选了「保险箱密码」，请填写密码（想免密直读请改选「无需密码」）'
    return
  }

  publishing.value = true
  try {
    if (isPrivate.value) {
      const payload = { title: title.value.trim(), tags: tagList.value, body: '\n' + body.value.trim() + '\n' }
      if (unlockMode.value === 'egg') {
        // 彩蛋：固定派生密钥轻度混淆，访客在首页诗句署名点中「博尔赫斯」后出现在密文页
        const enc = await encryptForVault(payload, EGG_KEY)
        const entry = { id: fileId.value, date: date.value || today(), egg: true, ...enc }
        await ghPut(`private-vault/${fileId.value}.json`, JSON.stringify(entry, null, 2), `publish(彩蛋): ${title.value.trim()}`)
        pubMsg.value = `彩蛋发布成功！「${title.value.trim()}」将藏入密文页——访客在首页诗句署名点中「博尔赫斯」后现身。`
      } else if (unlockMode.value === 'pw') {
        // 保险箱密码：正文在浏览器本地加密，仓库与服务器只会拿到密文
        const enc = await encryptForVault(payload, vaultPw.value)
        const entry = { id: fileId.value, date: date.value || today(), ...enc }
        await ghPut(`private-vault/${fileId.value}.json`, JSON.stringify(entry, null, 2), `publish(加密): ${title.value.trim()}`)
        pubMsg.value = `加密发布成功！「${title.value.trim()}」将在 1-2 分钟后出现在「密文」页，输入保险箱密码即可查看。`
      } else {
        // 无需密码：进「密文」页即可阅读（仍受花锁门禁保护）
        const entry = { id: fileId.value, date: date.value || today(), plain: true, payload }
        await ghPut(`private-vault/${fileId.value}.json`, JSON.stringify(entry, null, 2), `publish(密文·免密): ${title.value.trim()}`)
        pubMsg.value = `发布成功！「${title.value.trim()}」将在 1-2 分钟后出现在「密文」页，无需密码即可阅读。`
      }
    } else {
      await ghPut(`docs/posts/${fileName.value}`, markdown.value, `publish: ${title.value.trim()}`)
      pubMsg.value = `发布成功！「${title.value.trim()}」将在 1-2 分钟后出现在首页和归档。`
    }
    pubOk.value = true
  } catch (e) {
    pubErr.value = e instanceof Error ? e.message : String(e)
    // Token 缺失或权限失效时自动展开填写框
    if (/401|403|Bad credentials|Token/.test(pubErr.value)) showTokenField.value = true
  } finally {
    publishing.value = false
  }
}

// —— 项目管理 ——
interface ProjItem {
  name: string
  desc: string
  link: string
  repo: string
  folder: string
  tags: string[]
}

const tab = ref<'post' | 'projects'>('post')
const projects = ref<ProjItem[]>([])
const projLoading = ref(false)
const projMsg = ref('')
const projErr = ref('')
const editing = ref<number | null>(null) // -1 表示新增
const pForm = ref({ name: '', desc: '', link: '', repo: '', folder: '', tags: '' })
const delIdx = ref<number | null>(null)
const delFiles = ref(false)

// 极简 YAML 子集解析：只处理 projects.md 的 items 结构
function yamlVal(v: string) {
  const s = v.trim()
  if (s.length > 1 && /^".*"$/.test(s)) return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  return s
}

function parseProjects(raw: string): ProjItem[] {
  const items: ProjItem[] = []
  let cur: ProjItem | null = null
  let curTags: string[] | null = null
  let inItems = false
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue
    if (/^items:\s*$/.test(line.trim())) {
      inItems = true
      continue
    }
    if (!inItems) continue
    const start = line.match(/^\s*-\s*(\w+):\s*(.*)$/)
    if (start) {
      cur = { name: yamlVal(start[2]), desc: '', link: '', repo: '', folder: '', tags: [] }
      items.push(cur)
      curTags = null
      continue
    }
    const li = line.match(/^\s*-\s+(.*)$/)
    if (li && curTags && cur) {
      curTags.push(yamlVal(li[1]))
      continue
    }
    const kv = line.match(/^\s*(\w+):\s*(.*)$/)
    if (kv && cur) {
      if (kv[1] === 'tags') {
        curTags = cur.tags
      } else if (kv[1] === 'name') cur.name = yamlVal(kv[2])
      else if (kv[1] === 'desc') cur.desc = yamlVal(kv[2])
      else if (kv[1] === 'link') cur.link = yamlVal(kv[2])
      else if (kv[1] === 'repo') cur.repo = yamlVal(kv[2])
      else if (kv[1] === 'folder') cur.folder = yamlVal(kv[2])
    }
  }
  return items
}

function q(s: string) {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function serializeProjects(items: ProjItem[]) {
  const out = ['---', 'layout: projects', 'title: 项目', 'items:']
  for (const p of items) {
    out.push(`  - name: ${q(p.name)}`)
    out.push(`    desc: ${q(p.desc)}`)
    if (p.link) out.push(`    link: ${q(p.link)}`)
    if (p.repo) out.push(`    repo: ${q(p.repo)}`)
    if (p.folder) out.push(`    folder: ${q(p.folder)}`)
    if (p.tags.length) {
      out.push('    tags:')
      p.tags.forEach((t) => out.push(`      - ${t}`))
    }
  }
  out.push('---', '')
  return out.join('\n')
}

function decodeB64(b64: string) {
  const bin = atob(b64.replace(/\n/g, ''))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

async function loadProjects() {
  projMsg.value = ''
  projErr.value = ''
  projLoading.value = true
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/docs/projects.md?ref=main`)
    if (!res.ok) throw new Error(`读取项目列表失败（GitHub ${res.status}）`)
    const j = await res.json()
    projects.value = parseProjects(decodeB64(j.content))
  } catch (e) {
    projErr.value = e instanceof Error ? e.message : String(e)
  } finally {
    projLoading.value = false
  }
}

async function persistProjects(list: ProjItem[], message: string) {
  if (!token.value.trim()) {
    projErr.value = '保存需要 GitHub Token，请在「写文章」标签底部配置一次'
    return false
  }
  projLoading.value = true
  try {
    const headers = {
      Authorization: `Bearer ${token.value.trim()}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    }
    const url = `https://api.github.com/repos/${REPO}/contents/docs/projects.md`
    const get = await fetch(`${url}?ref=main`, { headers })
    const sha = get.ok ? (await get.json()).sha : undefined
    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message,
        content: b64encode(serializeProjects(list)),
        branch: 'main',
        ...(sha ? { sha } : {})
      })
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}) as { message?: string })
      throw new Error(`保存失败 GitHub ${res.status}: ${j.message ?? '未知错误'}`)
    }
    projects.value = list
    projMsg.value = '已保存！项目页将在 1-2 分钟后自动更新。'
    return true
  } catch (e) {
    projErr.value = e instanceof Error ? e.message : String(e)
    return false
  } finally {
    projLoading.value = false
  }
}

function startAdd() {
  editing.value = -1
  pForm.value = { name: '', desc: '', link: '', repo: '', folder: '', tags: '' }
}

function startEdit(i: number) {
  editing.value = i
  const p = projects.value[i]
  pForm.value = { name: p.name, desc: p.desc, link: p.link, repo: p.repo, folder: p.folder, tags: p.tags.join(' ') }
}

function cancelEdit() {
  editing.value = null
}

async function saveProject() {
  projMsg.value = ''
  projErr.value = ''
  const f = pForm.value
  if (!f.name.trim() || !f.desc.trim()) {
    projErr.value = '项目名称和简介必须填写'
    return
  }
  const item: ProjItem = {
    name: f.name.trim(),
    desc: f.desc.trim(),
    link: f.link.trim(),
    repo: f.repo.trim(),
    folder: f.folder.trim(),
    tags: f.tags.split(/[,，\s]+/).map((t) => t.trim()).filter(Boolean)
  }
  const list = [...projects.value]
  if (editing.value === -1) list.push(item)
  else list[editing.value] = item
  const ok = await persistProjects(list, `projects: ${editing.value === -1 ? '新增' : '更新'} ${item.name}`)
  if (ok) editing.value = null
}

async function confirmDel() {
  if (delIdx.value === null) return
  const idx = delIdx.value
  const item = projects.value[idx]
  projMsg.value = ''
  projErr.value = ''
  projLoading.value = true
  try {
    if (delFiles.value && item.folder) {
      const headers = {
        Authorization: `Bearer ${token.value.trim()}`,
        Accept: 'application/vnd.github+json'
      }
      // 列出文件夹内所有文件，逐个删除
      const list = await fetch(
        `https://api.github.com/repos/${REPO}/contents/${encodeURI(item.folder)}?ref=main`,
        { headers }
      )
      if (list.ok) {
        const files = (await list.json()) as { path: string; type: string; sha: string }[]
        for (const file of files) {
          if (file.type !== 'file') continue
          await fetch(`https://api.github.com/repos/${REPO}/contents/${encodeURI(file.path)}`, {
            method: 'DELETE',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `projects: 删除 ${item.name} 的文件 ${file.path}`,
              sha: file.sha,
              branch: 'main'
            })
          })
        }
      }
    }
    const list = projects.value.filter((_, i) => i !== idx)
    const ok = await persistProjects(list, `projects: 删除 ${item.name}`)
    if (ok) {
      delIdx.value = null
      delFiles.value = false
    }
  } finally {
    projLoading.value = false
  }
}
</script>
<template>
  <h1 class="page-title">创作</h1>

  <div class="tabs">
    <button class="tab" :class="{ active: tab === 'post' }" type="button" @click="tab = 'post'">
      写文章
    </button>
    <button
      class="tab"
      :class="{ active: tab === 'projects' }"
      type="button"
      @click="tab = 'projects'"
    >
      管项目
    </button>
  </div>

  <template v-if="tab === 'post'">
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
      <input v-model="isPinned" type="checkbox" />
      <span>置顶（显示在首页文章列表最前面）</span>
    </label>
  </div>

  <div class="field">
    <label class="check">
      <input v-model="isPrivate" type="checkbox" />
      <span>隐藏文章（不进入公开列表，只出现在「密文」页）</span>
    </label>
    <p v-if="isPrivate" class="hint">
      选一种解锁方式：访客进入「密文」页后，<strong>无需密码</strong>直接阅读；
      <strong>保险箱密码</strong>要输对才能看；<strong>博尔赫斯彩蛋</strong>要先在首页点中诗句署名里的「博尔赫斯」。
    </p>
  </div>

  <div v-if="isPrivate" class="field">
    <label>解锁方式（三选一）</label>
    <div class="mode-group">
      <label class="check mode-item">
        <input v-model="unlockMode" type="radio" value="open" />
        <span>无需密码（进「密文」页直接读）</span>
      </label>
      <label class="check mode-item">
        <input v-model="unlockMode" type="radio" value="pw" />
        <span>保险箱密码（填了才加密）</span>
      </label>
      <label class="check mode-item">
        <input v-model="unlockMode" type="radio" value="egg" />
        <span>博尔赫斯彩蛋（首页诗句署名触发）</span>
      </label>
    </div>
  </div>

  <div v-if="isPrivate && unlockMode === 'pw'" class="field">
    <label>保险箱密码</label>
    <input
      v-model="vaultPw"
      type="password"
      class="input"
      placeholder="访客将在「密文」页输入它来阅读"
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
      <!-- 已配置：隐藏输入框，仅留一行小字；出错时自动展开 -->
      <template v-if="hasToken && !showTokenField">
        <p class="token-ok">
          GitHub Token 已配置 ✓
          <button class="text-btn" type="button" @click="showTokenField = true">更改</button>
        </p>
      </template>
      <template v-else>
        <label>
          GitHub Token（一键发布用，只需填一次）
          <button class="text-btn" type="button" @click="showToken = !showToken">
            {{ showToken ? '隐藏' : '显示' }}
          </button>
          <button
            v-if="hasToken"
            class="text-btn"
            type="button"
            @click="showTokenField = false"
          >
            收起
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
      </template>
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
      <strong>隐藏文章</strong>：勾选「隐藏文章」后点「一键发布」，文章只出现在「
      <a class="inline-link" href="/Destiny/vault.html">密文</a>」页。三种解锁方式（三选一）——
      无需密码：进页直接读；保险箱密码：加密发布，拿到密码的人输入后阅读；
      博尔赫斯彩蛋：访客在首页诗句署名点中「博尔赫斯」后，密文页凭空多出这篇文章。
    </p>
  </div>
  </template>

  <template v-else>
    <p class="page-desc">在这里添加、修改、删除项目页的卡片，保存后 1-2 分钟自动上线。</p>

    <div class="field">
      <button class="btn ghost" type="button" :disabled="projLoading" @click="loadProjects">
        {{ projLoading ? '读取中…' : projects.length ? '刷新列表' : '从仓库读取项目列表' }}
      </button>
      <span v-if="!hasToken" class="hint"> 提示：保存修改需要 GitHub Token（在「写文章」标签底部配置一次） </span>
    </div>

    <p v-if="projMsg" class="pub-ok">{{ projMsg }}</p>
    <p v-if="projErr" class="pub-err">{{ projErr }}</p>

    <ul v-if="projects.length" class="proj-list">
      <li v-for="(p, i) in projects" :key="i" class="proj-item">
        <div class="proj-row">
          <div class="proj-info">
            <div class="proj-head">
              <span class="proj-name">{{ p.name }}</span>
              <span v-if="p.link" class="proj-meta">外链</span>
              <span v-if="p.repo" class="proj-meta">GitHub</span>
              <span v-if="p.folder" class="proj-meta">关联文件夹</span>
            </div>
            <p class="proj-desc">{{ p.desc }}</p>
            <p v-if="p.tags.length" class="proj-tags">
              <span v-for="t in p.tags" :key="t">#{{ t }} </span>
            </p>
          </div>
          <div class="proj-ops">
            <button class="text-btn" type="button" @click="startEdit(i)">编辑</button>
            <button
              class="text-btn danger"
              type="button"
              @click="delIdx = delIdx === i ? null : i"
            >
              删除
            </button>
          </div>
        </div>
        <div v-if="delIdx === i" class="del-confirm">
          <label class="check">
            <input v-model="delFiles" type="checkbox" :disabled="!p.folder" />
            <span>
              同时删除关联文件夹（{{ p.folder || '该项目未设置文件夹' }}）
            </span>
          </label>
          <div class="del-actions">
            <button class="btn ghost danger" type="button" :disabled="projLoading" @click="confirmDel">
              {{ projLoading ? '删除中…' : '确认删除' }}
            </button>
            <button class="text-btn" type="button" @click="delIdx = null">取消</button>
          </div>
        </div>
      </li>
    </ul>
    <p v-else-if="!projLoading" class="hint">还没有读取到项目，点上面按钮从仓库加载。</p>

    <div v-if="editing !== null" class="proj-form">
      <h2 class="form-title">{{ editing === -1 ? '新增项目' : '编辑项目' }}</h2>
      <div class="field">
        <label>项目名称 *</label>
        <input v-model="pForm.name" type="text" class="input" placeholder="我的小工具" />
      </div>
      <div class="field">
        <label>简介 *</label>
        <input v-model="pForm.desc" type="text" class="input" placeholder="一句话介绍这个项目" />
      </div>
      <div class="row">
        <div class="field">
          <label>在线地址（可选）</label>
          <input v-model="pForm.link" type="text" class="input" placeholder="https://…" />
        </div>
        <div class="field">
          <label>GitHub 仓库（可选）</label>
          <input v-model="pForm.repo" type="text" class="input" placeholder="https://github.com/…" />
        </div>
      </div>
      <div class="row">
        <div class="field">
          <label>关联文件夹（可选，删除卡片时清理用）</label>
          <input
            v-model="pForm.folder"
            type="text"
            class="input mono"
            placeholder="docs/public/apps/demo"
          />
        </div>
        <div class="field">
          <label>标签（逗号或空格分隔，可选）</label>
          <input v-model="pForm.tags" type="text" class="input" placeholder="工具 Vue" />
        </div>
      </div>
      <div class="actions">
        <button class="btn" type="button" :disabled="projLoading" @click="saveProject">
          {{ projLoading ? '保存中…' : '保存' }}
        </button>
        <button class="btn ghost" type="button" @click="cancelEdit">取消</button>
      </div>
    </div>

    <div v-else class="field">
      <button class="btn publish" type="button" @click="startAdd">＋ 新增项目</button>
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
.mode-group {
  display: grid;
  gap: 0.4rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
}
.mode-item {
  cursor: pointer;
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
.token-ok {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 0.75rem;
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
/* —— 标签栏 —— */
.tabs {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 1.5rem;
}
.tab {
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  color: var(--muted);
  font-size: 0.9375rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}
.tab:hover {
  color: var(--fg);
}
.tab.active {
  color: var(--fg);
  border-bottom-color: var(--fg);
  font-weight: 500;
}
/* —— 项目管理 —— */
.proj-list {
  list-style: none;
  margin: 0 0 1.5rem;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}
.proj-item {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.9rem 1.1rem;
}
.proj-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}
.proj-head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.proj-name {
  font-weight: 600;
}
.proj-meta {
  font-size: 0.6875rem;
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 0 0.35rem;
  line-height: 1.6;
}
.proj-desc {
  margin: 0.3rem 0 0;
  color: var(--muted);
  font-size: 0.875rem;
}
.proj-tags {
  margin: 0.35rem 0 0;
  color: var(--muted);
  font-size: 0.75rem;
}
.proj-ops {
  display: flex;
  gap: 0.9rem;
  flex-shrink: 0;
}
.del-confirm {
  margin-top: 0.75rem;
  padding: 0.75rem 0.9rem;
  border: 1px dashed var(--border);
  border-radius: 6px;
  display: grid;
  gap: 0.6rem;
}
.del-actions {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}
.text-btn.danger:hover {
  color: #c0392b;
}
.btn.ghost.danger:hover:not(:disabled) {
  color: #c0392b;
  border-color: #c0392b;
}
.proj-form {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.1rem 1.25rem 0.25rem;
  margin-bottom: 1.5rem;
}
.form-title {
  margin: 0 0 1rem;
  font-size: 1rem;
}
@media (max-width: 560px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>

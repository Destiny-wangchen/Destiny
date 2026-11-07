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
  if (isPrivate.value) lines.push('private: true')
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

onMounted(() => {
  date.value = today()
  try {
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
</script>

<template>
  <h1 class="page-title">写文章</h1>
  <p class="page-desc">
    在这里写完，导出 <code>.md</code> 再放进仓库。草稿会自动存在这台设备的浏览器里。
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
    <p class="hint">会成为 URL：<code>/posts/{{ fileName.replace('.md', '') }}</code></p>
  </div>

  <div class="field">
    <label class="check">
      <input v-model="isPrivate" type="checkbox" />
      <span>私密文章（只有我自己看）</span>
    </label>
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

  <div class="actions">
    <button class="btn" type="button" :disabled="!ready" @click="download">
      下载 {{ fileName }}
    </button>
    <button class="btn ghost" type="button" :disabled="!ready" @click="copy">
      {{ copied ? '已复制' : '复制 Markdown' }}
    </button>
  </div>

  <div class="howto">
    <p v-if="!isPrivate">
      <strong>公开文章：</strong>把下载的 <code>{{ fileName }}</code> 放进
      <code>docs/posts/</code>，重新构建发布后，首页和归档会自动收录。
    </p>
    <p v-else>
      <strong>私密文章：</strong>把 <code>{{ fileName }}</code> 放进 <code>private-src/</code>，然后在项目里运行
      <code>npm run lock</code> 加密并重新构建。<code>private-src/</code> 不会被打包进网站。
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
.field label {
  display: block;
  font-size: 0.8125rem;
  color: var(--muted);
  margin-bottom: 0.35rem;
}
.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
}
.check {
  display: flex;
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
.btn.ghost {
  background: none;
  color: var(--fg);
  border-color: var(--border);
}
.btn.ghost:hover:not(:disabled) {
  border-color: var(--muted);
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
  margin: 0;
}
@media (max-width: 560px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>

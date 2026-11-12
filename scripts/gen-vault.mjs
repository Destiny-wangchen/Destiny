#!/usr/bin/env node
/**
 * 构建前聚合所有私密内容，生成 docs/.vitepress/vault-data.ts。
 *
 * 两个来源：
 *  1. private-vault/*.json —— 写作页面在浏览器里加密后通过 GitHub API 上传的密文
 *     （格式：{ id, date, salt, iv, ct, iter }，仓库里只有密文，安全）
 *  2. private-src/*.md —— 本地明文工作流：存在 .vault-password 时现场加密
 */
import { createCipheriv, pbkdf2Sync, randomBytes } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readExistingEntries, reuseIfUnchanged } from './vault-reuse.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const vaultDir = join(root, 'private-vault')
const srcDir = join(root, 'private-src')
const pwFile = join(root, '.vault-password')
const outFile = join(root, 'docs', '.vitepress', 'vault-data.ts')

const ITER = 200000

function encrypt(text, password) {
  const salt = randomBytes(16)
  const iv = randomBytes(12)
  const key = pbkdf2Sync(password, salt, ITER, 32, 'sha256')
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ct = Buffer.concat([cipher.update(text, 'utf8'), cipher.final(), cipher.getAuthTag()])
  return { salt: salt.toString('base64'), iv: iv.toString('base64'), ct: ct.toString('base64') }
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) return { data: {}, body: raw }
  const data = {}
  let currentKey = null
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    const listItem = line.match(/^\s+-\s+(.*)$/)
    if (listItem && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = []
      data[currentKey].push(listItem[1].replace(/^["']|["']$/g, '').trim())
      continue
    }
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (kv) {
      currentKey = kv[1]
      const value = kv[2].replace(/^["']|["']$/g, '').trim()
      data[currentKey] = value === '' ? null : value
    }
  }
  return { data, body: raw.slice(m[0].length) }
}

const byId = new Map()
// 上一次产物里的条目：明文没变的直接复用旧密文，避免每次构建都产生无意义 diff
const previous = readExistingEntries(outFile)

// 来源 1：浏览器上传的密文（公开仓库中仅存密文）
if (existsSync(vaultDir)) {
  for (const f of readdirSync(vaultDir).filter((f) => f.endsWith('.json'))) {
    try {
      const e = JSON.parse(readFileSync(join(vaultDir, f), 'utf8'))
      if (e && e.salt && e.iv && e.ct) byId.set(e.id ?? f.replace(/\.json$/, ''), e)
    } catch (err) {
      console.warn(`  ! 跳过无效文件 ${f}: ${err.message}`)
    }
  }
}

// 来源 2：本地明文（private-src/*.md + .vault-password）
if (existsSync(srcDir) && existsSync(pwFile)) {
  const pw = readFileSync(pwFile, 'utf8').trim()
  if (pw) {
    for (const f of readdirSync(srcDir).filter((f) => f.endsWith('.md'))) {
      const raw = readFileSync(join(srcDir, f), 'utf8')
      const { data, body } = parseFrontmatter(raw)
      const id = f.replace(/\.md$/, '')
      if (byId.has(id)) continue // 线上版本优先，避免本地旧稿覆盖
      const payload = {
        title: String(data.title ?? id),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : data.tags ? [String(data.tags)] : [],
        body
      }
      const plaintext = JSON.stringify(payload)
      const reused = reuseIfUnchanged(previous, id, plaintext, pw)
      const { salt, iv, ct } = reused ?? encrypt(plaintext, pw)
      if (reused) console.log(`  = ${f} 明文未变，复用原密文`)
      byId.set(id, { id, date: String(data.date ?? ''), salt, iv, ct, iter: ITER })
    }
  }
}

const entries = [...byId.values()]
const header = `// 由 scripts/gen-vault.mjs 生成（npm run build 时自动执行），请勿手改。\nimport type { VaultEntry } from './theme/vault'\n\nconst entries: VaultEntry[] = `
const content = `${header}${JSON.stringify(entries, null, 2)}\n\nexport default entries\n`
// 内容一字未改就不落盘：省掉一次无意义的写入，也避免 dev server 被自己触发的改动重载。
// 比较前统一换行符——Windows 上 checkout 出来可能是 CRLF，按字节比会误判成「变了」。
const sameAsBefore =
  existsSync(outFile) && readFileSync(outFile, 'utf8').replace(/\r\n/g, '\n') === content
if (sameAsBefore) {
  console.log(`vault: ${entries.length} 篇私密内容，产物无变化（未写入）`)
} else {
  writeFileSync(outFile, content, 'utf8')
  console.log(`vault: ${entries.length} 篇私密内容 -> docs/.vitepress/vault-data.ts`)
}

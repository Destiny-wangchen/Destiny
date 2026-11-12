#!/usr/bin/env node
/**
 * 把 private-src/*.md 加密成 docs/.vitepress/vault-data.ts。
 * 网站构建产物里只有密文，浏览器拿到密码后才在本地解密。
 *
 * 用法：
 *   npm run lock                       # 密码读 .vault-password，没有就生成一个
 *   VAULT_PASSWORD=xxx npm run lock    # 临时指定密码
 */
import { createCipheriv, pbkdf2Sync, randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readExistingEntries, reuseIfUnchanged } from './vault-reuse.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'private-src')
const outFile = join(root, 'docs', '.vitepress', 'vault-data.ts')
const pwFile = join(root, '.vault-password')

const ITER = 200000

function getPassword() {
  if (process.env.VAULT_PASSWORD) return process.env.VAULT_PASSWORD
  if (existsSync(pwFile)) {
    const pw = readFileSync(pwFile, 'utf8').trim()
    if (pw) return pw
  }
  const pw = randomBytes(9).toString('base64url')
  writeFileSync(pwFile, pw + '\n', 'utf8')
  console.log(`\n没有找到密码，已生成一个并写入 .vault-password：\n  ${pw}\n请记好它，忘了就打不开了。\n`)
  return pw
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

function encrypt(text, password) {
  const salt = randomBytes(16)
  const iv = randomBytes(12)
  const key = pbkdf2Sync(password, salt, ITER, 32, 'sha256')
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ct = Buffer.concat([cipher.update(text, 'utf8'), cipher.final(), cipher.getAuthTag()])
  return { salt: salt.toString('base64'), iv: iv.toString('base64'), ct: ct.toString('base64') }
}

function main() {
  const password = getPassword()
  if (!existsSync(srcDir)) mkdirSync(srcDir, { recursive: true })
  const files = readdirSync(srcDir).filter((f) => f.endsWith('.md'))
  const previous = readExistingEntries(outFile)

  const entries = files.map((file) => {
    const raw = readFileSync(join(srcDir, file), 'utf8')
    const { data, body } = parseFrontmatter(raw)
    const id = file.replace(/\.md$/, '')
    const payload = {
      title: String(data.title ?? id),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : data.tags ? [String(data.tags)] : [],
      body
    }
    const plaintext = JSON.stringify(payload)
    const reused = reuseIfUnchanged(previous, id, plaintext, password)
    const { salt, iv, ct } = reused ?? encrypt(plaintext, password)
    const date = String(data.date ?? '')
    console.log(`  ${reused ? '=' : '✓'} ${file}  ${payload.title}${reused ? '（明文未变，复用原密文）' : ''}`)
    return { id, date, salt, iv, ct, iter: ITER }
  })

  const header = `// 由 scripts/lock.mjs 生成（npm run lock），请勿手改。\nimport type { VaultEntry } from './theme/vault'\n\nconst entries: VaultEntry[] = `
  writeFileSync(outFile, `${header}${JSON.stringify(entries, null, 2)}\n\nexport default entries\n`, 'utf8')

  console.log(`\n已加密 ${entries.length} 篇 → docs/.vitepress/vault-data.ts`)
  if (!entries.length) console.log('（private-src/ 下没有 .md 文件）')
}

main()

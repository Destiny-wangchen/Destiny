import { readFileSync } from 'node:fs'
import { webcrypto as crypto } from 'node:crypto'

const root = 'C:/Users/Bruce/CodeBuddy/20261107174057'
const src = readFileSync(`${root}/docs/.vitepress/vault-data.ts`, 'utf8')
const json = src.slice(src.indexOf('= [') + 2, src.lastIndexOf('\n\nexport default'))
const entries = JSON.parse(json)
const password = readFileSync(`${root}/.vault-password`, 'utf8').trim()

const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

async function decrypt(entry, pw = password) {
  const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64(entry.salt), iterations: entry.iter, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(entry.iv) }, key, b64(entry.ct))
  return JSON.parse(new TextDecoder().decode(plain))
}

for (const e of entries) {
  const p = await decrypt(e)
  console.log(`解密成功：${p.title} / 标签 ${p.tags.join(',')} / 正文 ${p.body.trim().length} 字`)
}
try {
  await decrypt(entries[0], 'wrong-password')
} catch {
  console.log('错误密码被正确拒绝')
}

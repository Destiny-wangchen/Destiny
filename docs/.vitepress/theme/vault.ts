/**
 * 私密内容（密码保险箱）的加解密工具。
 * 加密在本地脚本里做（scripts/lock.mjs），浏览器只负责解密，
 * 因此构建产物里只有密文，没有明文。
 */

export interface VaultEntry {
  /** 文件名（不含扩展名），仅用于排序/调试，不含正文信息 */
  id: string
  /** 展示用日期 */
  date: string
  /** PBKDF2 盐，base64 */
  salt: string
  /** AES-GCM IV，base64 */
  iv: string
  /** 密文，base64 */
  ct: string
  /** PBKDF2 迭代次数 */
  iter: number
}

/**
 * 免密条目：发布时不填保险箱密码的私密文章。
 * 只受花锁门禁保护，进入密文页无需再输密码。
 */
export interface PlainVaultEntry {
  id: string
  date: string
  plain: true
  payload: VaultPayload
}

/**
 * 彩蛋条目：用固定派生密钥轻度混淆的文章。
 * 入口是首页诗句署名彩蛋（点中博尔赫斯），防君子不防有心人。
 */
export interface EggVaultEntry {
  id: string
  date: string
  egg: true
  salt: string
  iv: string
  ct: string
  iter: number
}

export type AnyVaultEntry = VaultEntry | PlainVaultEntry | EggVaultEntry

export function isPlainEntry(e: AnyVaultEntry): e is PlainVaultEntry {
  return 'plain' in e && e.plain === true
}

export function isEggEntry(e: AnyVaultEntry): e is EggVaultEntry {
  return 'egg' in e && e.egg === true
}

/** 彩蛋混淆密钥：与首页诗句署名彩蛋呼应，仅起混淆作用 */
export const EGG_KEY = 'borges-garden-of-forking-paths-1941'

/** 彩蛋触发标记（sessionStorage，会话级） */
export const EGG_FLAG = 'garden-egg-unlocked'

export interface VaultPayload {
  title: string
  tags: string[]
  body: string
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function deriveKey(password: string, salt: Uint8Array, iterations: number) {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )
}

/** 解密单条记录，密码不对时抛错（加密与彩蛋条目通用） */
export async function decryptEntry(
  entry: VaultEntry | EggVaultEntry,
  password: string
): Promise<VaultPayload> {
  const key = await deriveKey(password, b64ToBytes(entry.salt), entry.iter)
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBytes(entry.iv) as unknown as BufferSource },
    key,
    b64ToBytes(entry.ct) as unknown as BufferSource
  )
  return JSON.parse(new TextDecoder().decode(plain)) as VaultPayload
}

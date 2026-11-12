/**
 * 密文复用的共用逻辑。
 *
 * 背景：salt 与 iv 都是随机的，所以每次构建重新加密同一篇明文也会得到完全不同的
 * 密文，导致 vault-data.ts 出现一大段看不懂的 diff（内容没变、仓库却显示改了）。
 *
 * 做法：加密前先看旧文件里有没有同 id 的条目，用密码解出来跟当前明文比一下——
 * 一模一样就原样复用旧的 salt/iv/ct。明文真的改了才重新加密。
 *
 * 注意：这里刻意保留随机 salt/iv，没有改成「由内容推导」的确定性 IV。
 * 因为 iv 是公开写进产物里的，一旦它由明文哈希推导，任何人不用密码就能拿候选
 * 明文去比对 iv、离线验证猜测是否正确，密码这道门就形同虚设了。
 */
import { createDecipheriv, pbkdf2Sync } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'

export const ITER = 200000

/** 读现有 vault-data.ts，返回 id -> entry 的 Map（文件不存在或格式不对就返回空表） */
export function readExistingEntries(file) {
  if (!existsSync(file)) return new Map()
  try {
    const src = readFileSync(file, 'utf8')
    // 注意：Windows 上 checkout 出来的文件可能是 CRLF，别用 '\n\nexport default' 这种硬编码换行
    const start = src.indexOf('= [')
    const tail = src.lastIndexOf('export default')
    if (start < 0 || tail < 0) return new Map()
    const end = src.lastIndexOf(']', tail)
    if (end < start) return new Map()
    const list = JSON.parse(src.slice(start + 2, end + 1))
    if (!Array.isArray(list)) return new Map()
    return new Map(list.map((e) => [e.id, e]))
  } catch {
    return new Map()
  }
}

/** 用密码解开一条旧条目，失败则抛错（密码换了、密文坏了都会失败） */
export function decryptEntry(entry, password) {
  const key = pbkdf2Sync(password, Buffer.from(entry.salt, 'base64'), entry.iter ?? ITER, 32, 'sha256')
  const buf = Buffer.from(entry.ct, 'base64')
  const tag = buf.subarray(buf.length - 16)
  const data = buf.subarray(0, buf.length - 16)
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(entry.iv, 'base64'))
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

/**
 * 明文没变就返回可复用的 { salt, iv, ct, iter }，变了（或解不开）返回 null。
 */
export function reuseIfUnchanged(existing, id, plaintext, password) {
  const old = existing.get(id)
  if (!old) return null
  try {
    if (decryptEntry(old, password) !== plaintext) return null
  } catch {
    return null
  }
  return { salt: old.salt, iv: old.iv, ct: old.ct, iter: old.iter ?? ITER }
}

/**
 * 把 frontmatter 的日期格式化为 YYYY-MM-DD。
 * 兼容三种来源：Date 对象、YYYY-MM-DD 字符串、
 * VitePress 序列化产物（ISO 字符串，如 2026-09-12T00:00:00.000Z）。
 */
export function formatDate(d: unknown): string {
  const s = String(d ?? '')
  // ISO 字符串直接截取日期部分，避免时区换算带来的偏差
  const iso = s.match(/^(\d{4}-\d{2}-\d{2})T/)
  if (iso) return iso[1]
  const date = d instanceof Date ? d : new Date(s)
  if (!Number.isNaN(date.getTime())) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return s
}

/**
 * 显示用简化格式：今年的日期省略年份（11-09），往年的保留完整（2025-09-12）。
 * 入参须为 YYYY-MM-DD 格式。
 */
export function simplifyDate(d: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  const y = d.slice(0, 4)
  return y === String(new Date().getFullYear()) ? d.slice(5) : d
}

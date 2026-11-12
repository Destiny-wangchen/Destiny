/**
 * 把 frontmatter 的日期（可能是 Date 对象或字符串）格式化为 YYYY-MM-DD。
 */
export function formatDate(d: unknown): string {
  if (d instanceof Date) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return String(d ?? '')
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

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

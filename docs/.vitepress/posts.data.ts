import { createContentLoader } from 'vitepress'
import { formatDate } from './theme/formatDate'

export interface PostMeta {
  url: string
  title: string
  description: string
  date: string
  tags: string[]
  pinned: boolean
  // 系列：同一 series 的文章组成上下篇，seriesOrder 决定章节顺序（从 1 开始）
  series: string
  seriesOrder: number
}

declare const data: PostMeta[]
export { data }

export default createContentLoader('posts/*.md', {
  transform(raw) {
    return raw
      // 私密/草稿文章不进公开列表
      .filter((p) => !p.frontmatter.private && !p.frontmatter.draft)
      .map((p) => ({
        url: p.url,
        title: String(p.frontmatter.title ?? '未命名'),
        description: String(p.frontmatter.description ?? ''),
        date: formatDate(p.frontmatter.date),
        tags: Array.isArray(p.frontmatter.tags) ? p.frontmatter.tags.map(String) : [],
        pinned: !!p.frontmatter.pinned,
        series: String(p.frontmatter.series ?? ''),
        seriesOrder: Number(p.frontmatter.seriesOrder ?? 0)
      }))
      // 置顶文章排最前，其余按日期倒序
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date))
  }
})

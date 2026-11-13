import { createContentLoader } from 'vitepress'

export interface BookPage {
  url: string
  title: string
  series: string
  seriesOrder: number
}

declare const data: BookPage[]
export { data }

// 书籍内容（cbook / icbook）单独建一份索引：
// 不进 posts.data，避免混入首页文章时间线；PostNav 用它串起「目录页 → 章节」阅读链。
// 目录页（index.md）约定 seriesOrder: 0，排最前且不参与编号。
export default createContentLoader(['cbook/*.md', 'icbook/*.md'], {
  transform(raw) {
    return raw
      .filter((p) => !p.frontmatter.private && !p.frontmatter.draft)
      .map((p) => ({
        url: p.url,
        title: String(p.frontmatter.title ?? '未命名'),
        series: String(p.frontmatter.series ?? ''),
        seriesOrder: Number(p.frontmatter.seriesOrder ?? 0)
      }))
      .sort((a, b) => a.series.localeCompare(b.series) || a.seriesOrder - b.seriesOrder)
  }
})

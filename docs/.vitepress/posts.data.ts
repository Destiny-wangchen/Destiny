import { createContentLoader } from 'vitepress'

export interface PostMeta {
  url: string
  title: string
  date: string
  tags: string[]
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
        date: String(p.frontmatter.date ?? ''),
        tags: Array.isArray(p.frontmatter.tags) ? p.frontmatter.tags.map(String) : []
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
  }
})

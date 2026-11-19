import { execFileSync } from 'node:child_process'
import { createContentLoader } from 'vitepress'
import { formatDate } from './theme/formatDate'

export interface PostMeta {
  url: string
  title: string
  description: string
  date: string
  // 最近一次更新（取该文件最后一次 git 提交的日期），归档按它排序
  updated: string
  tags: string[]
  pinned: boolean
  // 系列：同一 series 的文章组成上下篇，seriesOrder 决定章节顺序（从 1 开始）
  series: string
  seriesOrder: number
  // 是否出现在首页：null = 未设置（无系列默认显示，有系列默认隐藏），true/false = 显式指定
  home: boolean | null
}

declare const data: PostMeta[]
export { data }

/** 取某个文件最后一次 git 提交的日期；拿不到（如浅克隆）时返回空串 */
function gitLastDate(file: string): string {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cd', '--date=short', '--', file], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
  } catch {
    return ''
  }
}

/** 内容加载器只给 url（/posts/x.html），反推出仓库内的文件路径 */
function fileOf(url: string): string {
  return `docs${url.replace(/\.html$/, '.md')}`
}

export default createContentLoader('posts/*.md', {
  transform(raw) {
    return raw
      // 私密/草稿文章不进公开列表
      .filter((p) => !p.frontmatter.private && !p.frontmatter.draft)
      .map((p) => {
        const date = formatDate(p.frontmatter.date)
        const updated = gitLastDate(fileOf(p.url)) || date
        return {
          url: p.url,
          title: String(p.frontmatter.title ?? '未命名'),
          description: String(p.frontmatter.description ?? ''),
          date,
          updated,
          tags: Array.isArray(p.frontmatter.tags) ? p.frontmatter.tags.map(String) : [],
          pinned: !!p.frontmatter.pinned,
          series: String(p.frontmatter.series ?? ''),
          seriesOrder: Number(p.frontmatter.seriesOrder ?? 0),
          home: p.frontmatter.home === undefined ? null : !!p.frontmatter.home
        }
      })
      // 首页：置顶文章排最前，其余按发布日期倒序
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date))
  }
})

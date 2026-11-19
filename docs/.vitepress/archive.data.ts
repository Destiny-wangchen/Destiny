import { execFileSync } from 'node:child_process'
import { createContentLoader } from 'vitepress'
import { formatDate } from './theme/formatDate'

/**
 * 归档数据源：全站所有成篇的内容，包括 posts 下的文章和各书库的章节。
 * 章节 frontmatter 里没有 date，就用 git 首次提交日期当首次发布日期。
 */

export interface ArchiveEntry {
  url: string
  title: string
  /** 首次发布日期 */
  date: string
  /** 最近一次更新时间 */
  updated: string
  /** 所属系列（书库章节才有），用于在时间线里区分出处 */
  series: string
  tags: string[]
}

declare const data: ArchiveEntry[]
export { data }

type GitDates = Map<string, { first: string; last: string }>

let cached: GitDates | null = null

/** 一次 git log 取到所有文件的首末提交日期，避免每篇起一个进程 */
function gitDates(): GitDates {
  if (cached) return cached
  const map: GitDates = new Map()
  cached = map
  try {
    const out = execFileSync(
      'git',
      ['log', '--pretty=format:__C__%cd', '--date=short', '--name-only'],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }
    )
    let cur = ''
    for (const line of out.split('\n')) {
      if (line.startsWith('__C__')) {
        cur = line.slice(5).trim()
        continue
      }
      const file = line.trim()
      if (!file || !cur) continue
      const hit = map.get(file)
      // 从新到旧遍历：第一次遇到就是最近一次，之后每次覆盖就是更早的一次
      if (hit) hit.first = cur
      else map.set(file, { first: cur, last: cur })
    }
  } catch {
    // 浅克隆或没有 git 时留空，调用方回退到 frontmatter 日期
  }
  return map
}

/** 内容加载器只给 url（/cbook/x.html），反推仓库内路径 */
function fileOf(url: string): string {
  return `docs${url.replace(/\.html$/, '.md')}`
}

export default createContentLoader(
  ['posts/*.md', 'cbook/*.md', 'icbook/*.md', 'clinic/*.md', 'mbook/*.md', 'dbook/*.md'],
  {
    transform(raw) {
      const dates = gitDates()
      return raw
        .filter((p) => {
          // 目录页不算文章；私密与草稿不进归档
          if (/index\.html$/.test(p.url)) return false
          if (p.frontmatter.private || p.frontmatter.draft) return false
          return true
        })
        .map((p) => {
          const g = dates.get(fileOf(p.url))
          const fmDate = p.frontmatter.date ? formatDate(p.frontmatter.date) : ''
          const date = fmDate || g?.first || ''
          const updated = g && g.last > date ? g.last : date
          return {
            url: p.url,
            title: String(p.frontmatter.title ?? '未命名'),
            date,
            updated,
            series: String(p.frontmatter.series ?? ''),
            tags: Array.isArray(p.frontmatter.tags) ? p.frontmatter.tags.map(String) : []
          }
        })
        // 一条日期都拿不到的条目无法放进时间线
        .filter((p) => p.date !== '')
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) ||
            b.updated.localeCompare(a.updated) ||
            a.url.localeCompare(b.url)
        )
    },
    // 章节动辄几十篇，不把源码一起打进客户端
    includeSrc: false
  }
)

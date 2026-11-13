import { defineConfig } from 'vitepress'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// 部署路径：本地预览与独立域名用 '/'，GitHub Pages 项目页用 '/Destiny/'
const base = process.env.VITEPRESS_BASE || '/'
const SITE_URL = process.env.SITE_URL || 'https://destiny-wangchen.github.io/Destiny'

// 提取 frontmatter 里的 title/date/tags（简单解析，够用即可）
function parsePost(rawInput: string) {
  // 去掉 UTF-8 BOM：编辑器另存为「UTF-8 带 BOM」时文件开头会多出 \uFEFF，
  // 会让下面的 ^--- 匹配失败，导致标题退回文件名、日期丢失（RSS / 搜索索引因此缺条目）
  const raw = rawInput.replace(/^\uFEFF/, '')
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  const meta: { title?: string; date?: string; tags: string[] } = { tags: [] }
  let body = raw
  if (m) {
    body = raw.slice(m[0].length)
    let curTag = false
    for (const line of m[1].split(/\r?\n/)) {
      if (/^\s*-\s+/.test(line)) {
        if (curTag) meta.tags.push(line.replace(/^\s*-\s+/, '').trim())
        continue
      }
      curTag = false
      const kv = line.match(/^(\w+):\s*(.*)$/)
      if (kv) {
        if (kv[1] === 'title') meta.title = kv[2].trim()
        else if (kv[1] === 'date') meta.date = kv[2].trim()
        else if (kv[1] === 'tags') curTag = true
      }
    }
  }
  return { meta, body }
}

// Markdown 转纯文本（用于搜索摘要与 RSS 描述）
function mdToText(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function xmlEscape(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export default defineConfig({
  lang: 'zh-CN',
  title: 'Destiny的花园',
  description: 'Destiny 的个人博客，记录文章、归档与项目',
  base,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
    ['meta', { property: 'og:site_name', content: 'Destiny的花园' }],
    [
      'link',
      { rel: 'alternate', type: 'application/rss+xml', title: 'Destiny的花园', href: `${base}feed.xml` }
    ],
    [
      'script',
      {},
      `(()=>{try{const t=localStorage.getItem('theme-appearance');const d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()`
    ]
  ],
  // SEO：构建时生成 sitemap.xml，方便搜索引擎收录
  // 注意 hostname 需要带尾部斜杠：VitePress 用相对路径拼接 URL，
  // 不带斜杠时 new URL('posts/x.html', 'https://site/Destiny') 会丢掉 /Destiny 前缀
  sitemap: {
    hostname: `${SITE_URL}/`
  },
  // 分享卡片：给每个页面注入 Open Graph 标签，
  // 分享到微信 / Telegram 等平台时会展示标题、摘要和预览图
  transformHead({ page, title, description }) {
    const pageUrl = `${SITE_URL}${base}${page.replace(/\.md$/, '.html')}`
    return [
      ['meta', { property: 'og:type', content: page === 'index.md' ? 'website' : 'article' }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: pageUrl }],
      ['meta', { property: 'og:image', content: `${SITE_URL}${base}og-cover.png` }]
    ]
  },
  markdown: {
    lineNumbers: false,
    // 单个回车即换行，与写作页输入/预览保持一致
    breaks: true,
    // 提取 h2 到 page.headers，供文章目录组件（Toc.vue）使用
    headers: { level: [2] },
    theme: { light: 'github-light', dark: 'github-dark' }
  },
  themeConfig: {
    lastUpdated: false
  },
  // 构建期生成：全站搜索索引 + RSS 订阅
  // 安全边界：只收录 docs/posts/ 下的公开文章，私密内容（private-src/private-vault）不进索引
  buildEnd(ctx) {
    const postsDir = join(ctx.srcDir, 'posts')
    if (!existsSync(postsDir)) return
    const files = readdirSync(postsDir).filter((f) => f.endsWith('.md'))
    const posts = files.map((f) => {
      const raw = readFileSync(join(postsDir, f), 'utf8')
      const { meta, body } = parsePost(raw)
      const slug = f.replace(/\.md$/, '')
      return {
        url: `/posts/${slug}.html`,
        title: meta.title || slug,
        date: meta.date || '',
        tags: meta.tags,
        text: mdToText(body)
      }
    })
    posts.sort((a, b) => b.date.localeCompare(a.date))

    // —— 搜索索引（供前端的 MiniSearch 使用）——
    const index = posts.map((p) => ({ ...p, text: p.text.slice(0, 1200) }))
    writeFileSync(join(ctx.outDir, 'search-index.json'), JSON.stringify(index), 'utf8')

    // —— RSS ——
    const items = posts
      .filter((p) => p.date)
      .map((p) => {
        const link = `${SITE_URL}${p.url}`
        return [
          '<item>',
          `<title>${xmlEscape(p.title)}</title>`,
          `<link>${xmlEscape(link)}</link>`,
          `<guid>${xmlEscape(link)}</guid>`,
          `<pubDate>${new Date(p.date).toUTCString()}</pubDate>`,
          `<description>${xmlEscape(p.text.slice(0, 300))}</description>`,
          '</item>'
        ].join('\n')
      })
    // 规范字段：lastBuildDate = 最新文章时间；atom:link 声明 feed 自身地址（部分阅读器会校验）
    const newest = posts.find((p) => p.date)
    const lastBuildDate = newest ? new Date(newest.date).toUTCString() : new Date().toUTCString()
    const feed = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>',
      `<title>${xmlEscape('Destiny的花园')}</title>`,
      `<link>${xmlEscape(SITE_URL + '/')}</link>`,
      `<description>${xmlEscape('Destiny 的个人博客，记录文章、归档与项目')}</description>`,
      `<atom:link rel="self" type="application/rss+xml" href="${xmlEscape(SITE_URL + base + 'feed.xml')}" />`,
      `<lastBuildDate>${lastBuildDate}</lastBuildDate>`,
      ...items,
      '</channel></rss>'
    ].join('\n')
    writeFileSync(join(ctx.outDir, 'feed.xml'), feed, 'utf8')
  }
})

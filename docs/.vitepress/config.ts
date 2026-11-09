import { defineConfig } from 'vitepress'

// 部署路径：本地预览与独立域名用 '/'，GitHub Pages 项目页用 '/Destiny/'
const base = process.env.VITEPRESS_BASE || '/'

export default defineConfig({
  lang: 'zh-CN',
  title: 'Destiny的花园',
  description: 'Destiny 的个人博客，记录文章、归档与项目',
  base,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
    ['meta', { property: 'og:site_name', content: 'Destiny的花园' }],
    [
      'script',
      {},
      `(()=>{try{const t=localStorage.getItem('theme-appearance');const d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()`
    ]
  ],
  markdown: {
    lineNumbers: false,
    // 单个回车即换行，与写作页输入/预览保持一致
    breaks: true,
    theme: { light: 'github-light', dark: 'github-dark' }
  },
  themeConfig: {
    lastUpdated: false
  }
})

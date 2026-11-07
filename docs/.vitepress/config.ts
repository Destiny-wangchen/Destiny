import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'Destiny的花园',
  description: 'Destiny 的个人博客，记录文章、归档与项目',
  base: '/Destiny/',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/Destiny/favicon.svg' }],
    [
      'script',
      {},
      `(()=>{try{const t=localStorage.getItem('theme-appearance');const d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()`
    ]
  ],
  markdown: {
    lineNumbers: false,
    theme: { light: 'github-light', dark: 'github-dark' }
  },
  themeConfig: {
    lastUpdated: false
  }
})

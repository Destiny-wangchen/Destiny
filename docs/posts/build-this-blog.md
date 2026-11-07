---
title: 用 VitePress + GitHub Pages 搭建个人博客
date: 2026-09-12
tags:
  - VitePress
  - 教程
---

记录一下这个博客是怎么搭起来的，方便以后回忆，也希望能帮到你。

## 为什么选 VitePress

- 基于 Vue 3 + Vite，**开发热更新极快**
- 纯 Markdown 写作，构建期生成静态 HTML，**SEO 友好**
- 默认输出体积小，配合 GitHub Pages **完全免费**

## 核心步骤

### 1. 初始化项目

```bash
npm init -y
npm install -D vitepress vue
```

### 2. 目录约定

```text
docs/
├── .vitepress/
│   ├── config.ts          # 站点配置
│   └── theme/             # 自定义极简主题
├── posts/                 # 博客文章
├── index.md               # 首页
├── archive.md             # 归档页
└── projects.md            # 项目展示
```

### 3. 自动收集文章

用 `createContentLoader` 在构建期收集 `posts/*.md` 的元信息：

```ts
export default createContentLoader('posts/*.md', {
  transform(raw) {
    return raw.sort((a, b) => b.frontmatter.date - a.frontmatter.date)
  }
})
```

列表页、归档页都从这一份数据渲染，**写新文章不需要改任何代码**。

### 4. 部署到 GitHub Pages

仓库里放一个 GitHub Actions 工作流，每次 push 到 `main` 分支自动构建，并把 `docs/.vitepress/dist` 发布到 Pages。

记得在仓库的 **Settings → Pages** 里把 Source 设为 **GitHub Actions**。

## 总结

整套方案没有服务器、没有数据库，只有一个 Git 仓库。写作体验专注，加载速度飞快——很适合想认真写字的人。

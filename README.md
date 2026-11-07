# Destiny 的花园

个人博客，基于 [VitePress](https://vitepress.dev) 构建，部署在 GitHub Pages。

线上地址：<https://destiny-wangchen.github.io/Destiny/>

## 本地开发

```bash
npm install       # 首次运行安装依赖
npm run dev       # 启动本地预览 http://localhost:5173
npm run build     # 构建生产版本
npm run preview   # 预览构建结果
```

## 如何写新文章

1. 在 `docs/posts/` 下新建 `.md` 文件，文件名会成为 URL（如 `my-first-post.md` → `/Destiny/posts/my-first-post`）。
2. 文件开头写 frontmatter：

```md
---
title: 文章标题
date: 2026-01-01
tags:
  - 标签一
  - 标签二
---

正文……
```

3. 保存后 `git push`，GitHub Actions 自动构建并发布，约 1-2 分钟后线上生效。

首页与归档页会自动收录新文章，无需手动维护列表。

也可以直接用站内的「写文章」页面（`/write`），支持一键发布：

1. 首次使用：在 GitHub 创建一个 Fine-grained Token（[创建入口](https://github.com/settings/personal-access-tokens/new)），
   Repository access 选 **Only select repositories → Destiny**，Permissions 给 **Contents: Read and write**，
   填进写作页的 Token 输入框（只存在你自己的浏览器 localStorage 里，不进仓库）
2. 填标题、标签、正文 → 点「一键发布」→ 自动提交到仓库并触发 Actions 构建，1-2 分钟后上线
3. 草稿自动保存在浏览器里，随时回来继续写

## 隐藏文章（只有拿到密码的人能看）

在写作页勾选「隐藏文章」并填写保险箱密码，点「一键发布（加密）」：

- 正文在**浏览器本地**用该密码加密（PBKDF2 + AES-256-GCM）后才上传，仓库 `private-vault/`
  里只有密文，明文和密码都不经过任何服务器
- 隐藏文章不进入首页/归档；拿到密码的人在「私密」页（`/vault`）输入同一密码即可阅读
- 想让谁看，就把密码给谁；换密码 = 用新密码重新发布一遍

## 本地私密文章工作流（可选）

1. 把 `.md` 文件放进 `private-src/`（该目录已被 gitignore，明文不会离开本机）
2. 密码保存在 `.vault-password`（同样被 gitignore），可用 `VAULT_PASSWORD=你的密码 npm run lock` 指定
3. `npm run build` 时会自动把 `private-src/*.md` 加密并与线上密文合并生成 `vault-data.ts`

注意：忘记密码等于内容无法解密，请务必记好。

## 如何修改项目展示

编辑 `docs/projects.md` 顶部的 `items` 列表，每个项目支持：

```yaml
items:
  - name: 项目名
    desc: 一句话简介
    link: https://在线演示地址   # 可选
    repo: https://github.com/用户名/仓库   # 可选
    tags:
      - 技术栈
```

## 首次部署步骤

1. 在 GitHub 创建仓库 `Destiny-wangchen/Destiny`
2. 推送代码：

```bash
git init
git add .
git commit -m "init: Destiny的花园"
git branch -M main
git remote add origin https://github.com/Destiny-wangchen/Destiny.git
git push -u origin main
```

3. 打开仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
4. 等待 Actions 构建完成，访问 <https://destiny-wangchen.github.io/Destiny/>

## 阅读量统计说明

阅读量由第三方服务 [不蒜子](https://busuanzi.ibruce.info/) 提供（无需注册）。注意：

- 文章底部显示"阅读 N 次"，页脚显示全站访问量与访客数
- 数据保存在不蒜子的服务器上，如果该服务暂时不可用，会显示 `...`，不影响正常访问
- 首次部署后需要等搜索引擎/外部流量触发统计基数，数值从小数字开始

## 目录结构

```text
├── docs/
│   ├── .vitepress/
│   │   ├── config.ts           # 站点配置（标题、base、代码高亮等）
│   │   ├── posts.data.ts       # 自动收集文章元数据
│   │   ├── vault-data.ts       # 私密文章密文（build 时自动聚合生成）
│   │   ├── style.css           # 全局样式（极简黑白主题）
│   │   └── theme/              # 自定义主题与组件
│   ├── posts/                  # 博客文章
│   ├── index.md                # 首页
│   ├── archive.md              # 归档页
│   ├── projects.md             # 项目展示
│   ├── vault.md                # 私密阅读页
│   ├── write.md                # 写文章入口
│   └── public/                 # 静态资源（favicon 等）
├── private-src/                # 私密文章明文（gitignore，不进仓库不上网站）
├── private-vault/              # 写作页上传的加密文章（仅密文，可公开）
└── .github/workflows/deploy.yml  # 自动部署工作流
```

## 部署路径（base）

`base` 由环境变量 `VITEPRESS_BASE` 控制，默认 `/`（独立域名 / 平台托管直接用）。
部署到 GitHub Pages 项目页时需要 `/Destiny/`，工作流里已经设置好，本地不用管。

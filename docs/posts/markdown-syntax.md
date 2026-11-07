---
title: Markdown 常用语法速查
date: 2026-06-01
tags:
  - Markdown
  - 工具
---

一篇用来测试排版效果的速查笔记，也顺便当作备忘。

## 文本样式

普通文字，**加粗**，*斜体*，~~删除线~~，`行内代码`，也可以 [加个链接](https://vitepress.dev)。

## 列表

1. 有序列表第一项
2. 有序列表第二项

- 无序列表项
- 嵌套示例：
  - 子项一
  - 子项二

## 表格

| 语法 | 用途 |
| ---- | ---- |
| `#` | 标题 |
| `**` | 加粗 |
| `>` | 引用 |

## 代码块

```ts
// TypeScript 代码示例
interface Post {
  title: string
  date: string
  tags: string[]
}

const post: Post = {
  title: 'Markdown 常用语法速查',
  date: '2026-06-01',
  tags: ['Markdown', '工具']
}

console.log(`文章：${post.title}`)
```

## 引用

> 写作是一种整理自己想法的方式。
>
> 花园不需要很大，但要一直开花。

// 全站系列（专栏）注册表：首页展示区与文章上下篇导航共用这份数据
// items.order 决定系列内的章节顺序（从 1 开始）

export interface SeriesItem {
  title: string
  link: string
  order: number
}

export interface SeriesDef {
  name: string
  desc: string
  /** 系列入口链接（首页卡片点击跳转） */
  link: string
  items: SeriesItem[]
}

export const seriesList: SeriesDef[] = [
  {
    name: 'C语言',
    desc: '按知识点分类的例题册：8 章讲练分离，75 题可自选练习；结尾附一学期踩坑总结。',
    link: '/cbook/',
    items: [
      { title: '第 1 章 · Hello 世界与顺序结构', link: '/cbook/01-hello.html', order: 1 },
      { title: '第 2 章 · 分支结构', link: '/cbook/02-fenzhi.html', order: 2 },
      { title: '第 3 章 · 循环结构', link: '/cbook/03-xunhuan.html', order: 3 },
      { title: '第 4 章 · 穷举与递推', link: '/cbook/04-qiongju.html', order: 4 },
      { title: '第 5 章 · 图形输出', link: '/cbook/05-tuxing.html', order: 5 },
      { title: '第 6 章 · 数组', link: '/cbook/06-shuzu.html', order: 6 },
      { title: '第 7 章 · 字符串', link: '/cbook/07-zifuchuan.html', order: 7 },
      { title: '第 8 章 · 函数与递归', link: '/cbook/08-hanshu.html', order: 8 },
      { title: '我把一学期 C 语言踩过的坑整理成了这份排坑清单', link: '/posts/c-language-pitfalls.html', order: 9 }
    ]
  },
  {
    name: '集成电路',
    desc: '芯片入门：从沙子到智能。晶体管、制造工艺、应用与产业，每章 10 分钟，持续更新。',
    link: '/icbook/',
    items: [
      { title: '第 1 章 · 沙子的魔法：半导体与晶体管', link: '/icbook/01-silicon.html', order: 1 },
      { title: '第 2 章 · 芯片工厂：四大工艺循环', link: '/icbook/02-fab.html', order: 2 },
      { title: '第 3 章 · 芯片藏在哪：手机、汽车与 AI', link: '/icbook/03-applications.html', order: 3 },
      { title: '第 4 章 · 会动的芯片：MEMS', link: '/icbook/04-mems.html', order: 4 },
      { title: '第 5 章 · 机器的五感：传感器原理', link: '/icbook/05-sensors.html', order: 5 },
      { title: '第 6 章 · 芯片上的实验室：BioMEMS', link: '/icbook/06-biomems.html', order: 6 },
      { title: '第 7 章 · 行业地图：谁在造芯片', link: '/icbook/07-industry.html', order: 7 }
    ]
  },
  {
    name: '网站开发',
    desc: '建站与写作：Markdown 写作指南与个人博客搭建实录。',
    link: '/posts/build-this-blog.html',
    items: [
      { title: 'Markdown 写作指南：10 分钟学会，够用一辈子', link: '/posts/markdown-syntax.html', order: 1 },
      { title: '手把手教你搭建个人博客', link: '/posts/build-this-blog.html', order: 2 }
    ]
  }
]

/** 按系列名取系列定义 */
export function findSeries(name: string): SeriesDef | undefined {
  return seriesList.find((s) => s.name === name)
}

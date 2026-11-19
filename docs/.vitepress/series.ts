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
    desc: '按知识点分类的例题册：13 章讲练分离，124 题可自选练习，从 Hello 世界到动态规划入门。',
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
      { title: '第 9 章 · 指针与内存', link: '/cbook/09-pointer.html', order: 9 },
      { title: '第 10 章 · 结构体与链表', link: '/cbook/10-struct.html', order: 10 },
      { title: '第 11 章 · 算法四板斧：前缀和、差分、双指针、二分', link: '/cbook/11-prefix.html', order: 11 },
      { title: '第 12 章 · 搜索与图：从走迷宫到最短路', link: '/cbook/12-search.html', order: 12 },
      { title: '第 13 章 · 动态规划入门', link: '/cbook/13-dp.html', order: 13 },
      { title: '我把一学期 C 语言踩过的坑整理成了这份排坑清单', link: '/posts/c-language-pitfalls.html', order: 14 }
    ]
  },
  {
    name: 'C语言门诊',
    desc: '学过 C 之后再往下看一层：10 个真实症状，从报错查到病灶，每篇配一个能跑的实验。',
    link: '/clinic/',
    items: [
      { title: '病例 01 · 数组一大就崩，换个位置就好了', link: '/clinic/01-stack.html', order: 1 },
      { title: '病例 02 · 整数为什么会突然变成负数', link: '/clinic/02-twos-complement.html', order: 2 },
      { title: '病例 03 · 0.1 + 0.2 为什么不等于 0.3', link: '/clinic/03-float.html', order: 3 },
      { title: '病例 04 · 一个 struct 凭什么占 12 字节', link: '/clinic/04-padding.html', order: 4 },
      { title: '病例 05 · 同一个双重循环，换个内外层差十几倍', link: '/clinic/05-cache.html', order: 5 },
      { title: '病例 06 · 没赋值，为什么打印出一堆奇怪的东西', link: '/clinic/06-uninitialized.html', order: 6 },
      { title: '病例 07 · 一行 C 代码怎么变成 exe', link: '/clinic/07-build.html', order: 7 },
      { title: '病例 08 · 函数调用时机器到底记了什么', link: '/clinic/08-stack-frame.html', order: 8 },
      { title: '病例 09 · 端口被占用到底占了什么', link: '/clinic/09-port.html', order: 9 },
      { title: '病例 10 · 连接被拒绝和超时不是一回事', link: '/clinic/10-handshake.html', order: 10 }
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
    name: '推理小说诡计',
    desc: '按"骗什么"编排的诡计谱系：密室、建筑、时间、身份、叙述、破壁，8 篇梳理近两百年的手法与脑洞。',
    link: '/mbook/',
    items: [
      { title: '导论 · 诡计的解剖学', link: '/mbook/00-preface.html', order: 1 },
      { title: '第 1 章 · 骗空间', link: '/mbook/01-space.html', order: 2 },
      { title: '第 2 章 · 骗时间', link: '/mbook/02-time.html', order: 3 },
      { title: '第 3 章 · 骗人', link: '/mbook/03-person.html', order: 4 },
      { title: '第 4 章 · 骗语言', link: '/mbook/04-language.html', order: 5 },
      { title: '第 5 章 · 骗期待', link: '/mbook/05-expectation.html', order: 6 },
      { title: '第 6 章 · 舞台与模式', link: '/mbook/06-stage.html', order: 7 },
      { title: '第 7 章 · 索引、对照表与阅读路线', link: '/mbook/07-appendix.html', order: 8 }
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

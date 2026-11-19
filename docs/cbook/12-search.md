---
title: 第 12 章 · 搜索与图：从走迷宫到最短路
series: C语言
seriesOrder: 12
---

这一章的题目有一个共同点：答案不在某个公式里，而在"所有可能的走法"里。要做的是把这些走法组织成一棵树或一张图，然后用栈、队列或一个数组，有条理地走完它。

按结构分三类：

- **一条路走到黑**：栈、单调栈、单调队列，都是"保持某种单调性"的工具。
- **一层一层往外扩**：BFS，用来求最短步数；DFS 回溯，用来枚举所有方案。
- **把关系存成图**：并查集管连通性，Kruskal 求最小生成树，Dijkstra 求最短路。

必须养成的三个习惯：

- **大数组放全局**：本章动不动就是 `int a[100005]`，四个这样的数组就超过 1 MB 栈空间了。放全局既安全又省事，第 01 例讲过原因。
- **先画图再写代码**：BFS 画网格和队列，并查集画成几棵树，Kruskal 画成边的排序表。画出来之后，代码几乎就是照着图抄。
- **边界先想清楚**：起点等于终点、图不连通、n 等于 1，这三种情况最容易漏，也最容易被测试点抓住。

本章共 8 道题：2 道精讲例题 + 6 道自选练习。

## 精讲例题

### 例题 1 · 逆波兰表达式（栈）

给一个后缀表达式，运算符只有 `+ - * /`，操作数都是整数，求值。除法按整数除法。

**输入**：一行后缀表达式，元素之间用空格分隔。  
**输出**：一个整数。

**样例**

输入：
```text
3 4 + 2 *
```
输出：
```text
14
```

**思路**：后缀表达式天生适合用栈。遇到数字就压栈，遇到运算符就弹出两个数算一下再压回去。表达式扫完，栈里剩下的那个数就是答案。

两个细节：**先弹出的是右操作数**，减法和除法不能写反；除法的顺序反了，`8 2 -` 会算成 -6 而不是 6。

用 `scanf("%s")` 逐个读 token，读到文件结束为止，比自己切分字符串省事。判断是不是运算符，只需要看第一个字符。

```c
/* 129【应用】用栈求后缀表达式的值 */
#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    int st[10005], top = 0;
    char tok[32];

    while (scanf("%s", tok) == 1) {
        if (tok[0] == '+' || tok[0] == '-' || tok[0] == '*' || tok[0] == '/') {
            int b = st[--top];      /* 先弹出右操作数 */
            int a = st[--top];
            int r;
            switch (tok[0]) {
                case '+': r = a + b; break;
                case '-': r = a - b; break;
                case '*': r = a * b; break;
                default:  r = a / b; break;
            }
            st[top++] = r;
        } else {
            st[top++] = atoi(tok);
        }
    }
    printf("%d\n", st[top - 1]);
    return 0;
}
```

### 例题 2 · 迷宫最短路（BFS）

给一个 n×m 的 0/1 网格，`0` 可走，`1` 是墙。从左上角 `(1,1)` 走到右下角 `(n,m)`，每步上下左右走一格，求最少步数；走不到输出 `-1`。

**输入**：第一行 n m，随后 n 行，每行 m 个字符。  
**输出**：最少步数或 `-1`。

**样例**

输入：
```text
5 5
00000
01110
00000
01110
00000
```
输出：
```text
8
```

**思路**：BFS 的核心是"第一次到达某个格子时，走的就是最短路"。因为队列按步数分层，先入队的步数一定不大于后入队的。

实现上需要三样东西：距离数组 `d`（顺便当访问标记，初始 -1）、队列（用数组加头尾指针模拟，别用 `queue` 那种动态结构）、方向数组。

`d` 一开始全设 -1，起点设 0。出队时四个方向各试一次，越界和撞墙都要跳过。

```c
/* 132【应用】BFS 求网格最短步数 */
#include <stdio.h>

char g[1005][1005];
int d[1005][1005];
int qx[1000005], qy[1000005];

int main(void)
{
    int n, m, i, j, h = 0, t = 0;
    int dx[4] = {1, -1, 0, 0}, dy[4] = {0, 0, 1, -1};

    scanf("%d%d", &n, &m);
    for (i = 0; i < n; ++i) scanf("%s", g[i]);
    for (i = 0; i < n; ++i)
        for (j = 0; j < m; ++j) d[i][j] = -1;

    d[0][0] = 0;
    qx[t] = 0; qy[t] = 0; ++t;

    while (h < t) {
        int x = qx[h], y = qy[h];
        ++h;
        for (i = 0; i < 4; ++i) {
            int nx = x + dx[i], ny = y + dy[i];
            if (nx < 0 || nx >= n || ny < 0 || ny >= m) continue;
            if (g[nx][ny] == '1' || d[nx][ny] != -1) continue;
            d[nx][ny] = d[x][y] + 1;
            qx[t] = nx; qy[t] = ny; ++t;
        }
    }

    printf("%d\n", d[n - 1][m - 1]);
    return 0;
}
```

## 自选练习

::: details 练习 1 · 下一个更大的数（单调栈）（题面与样例）

给 n 个整数，对每个数输出它右边第一个比它大的数；没有则输出 `-1`。

**输入**：第一行 n（≤ 10⁵），第二行 n 个整数。  
**输出**：n 个答案，空格分隔。

**样例**

输入：
```text
5
3 1 4 1 5
```
输出：
```text
4 4 5 5 -1
```

从右往左扫，维护一个"单调不增"的栈。栈顶永远是最靠近当前位置的更大值。每来一个数，先把栈里所有比它小的弹掉，因为它们不会再被用到，然后栈顶就是答案。

每个元素最多入栈一次、出栈一次，复杂度 O(n)。这就是单调栈的全部。

:::

::: details 练习 1 · 参考代码

```c
/* 130【应用】单调栈：右边第一个更大的数 */
#include <stdio.h>

int a[100005], st[100005], ans[100005];

int main(void)
{
    int n, i, top = 0;

    scanf("%d", &n);
    for (i = 0; i < n; ++i) scanf("%d", &a[i]);

    for (i = n - 1; i >= 0; --i) {
        while (top > 0 && st[top - 1] <= a[i]) --top;
        ans[i] = top > 0 ? st[top - 1] : -1;
        st[top++] = a[i];
    }

    for (i = 0; i < n; ++i)
        printf("%d%c", ans[i], i == n - 1 ? '\n' : ' ');
    return 0;
}
```

:::

::: details 练习 2 · 滑动窗口最大值（单调队列）（题面与样例）

给 n 个整数和窗口宽度 k，输出每个窗口内的最大值。

**输入**：第一行 n k，第二行 n 个整数。  
**输出**：n−k+1 个最大值，空格分隔。

**样例**

输入：
```text
8 3
1 3 -1 -3 5 3 6 7
```
输出：
```text
3 3 5 5 6 7
```

队列里存**下标**，不存值，这样既能比较大小，又能判断"是否已经滑出窗口"。

保持队列里的值单调递减：新元素进来，把队尾比它小的全弹掉；再看队头下标是否小于 `i-k+1`，是就弹出。队头始终是当前窗口最大值。

:::

::: details 练习 2 · 参考代码

```c
/* 131【应用】单调队列：滑动窗口最大值 */
#include <stdio.h>

int a[100005], q[100005];

int main(void)
{
    int n, k, i, h = 0, t = 0;

    scanf("%d%d", &n, &k);
    for (i = 0; i < n; ++i) scanf("%d", &a[i]);

    for (i = 0; i < n; ++i) {
        while (h < t && a[q[t - 1]] <= a[i]) --t;
        q[t++] = i;
        while (q[h] <= i - k) ++h;
        if (i >= k - 1) printf("%d%c", a[q[h]], i == n - 1 ? '\n' : ' ');
    }
    return 0;
}
```

:::

::: details 练习 3 · N 皇后（DFS 回溯）（题面与样例）

在 n×n 的棋盘上放 n 个皇后，使它们互不攻击（不同行、不同列、不同斜线），输出方案数。

**输入**：一个整数 n（≤ 10）。  
**输出**：方案数。

**样例**

输入：
```text
8
```
输出：
```text
92
```

按行放：第 r 行只在某一列放一个皇后，所以行天然不冲突。冲突只剩三种：同列、主对角线（`r - c` 相同）、副对角线（`r + c` 相同）。

用三个标记数组，放之前查、放之后标记、递归回来再撤销。这个"标记—递归—撤销"的三段式是回溯的通用骨架。

斜线下标可能是负数，`r - c + n` 平移一下就不会越界。

:::

::: details 练习 3 · 参考代码

```c
/* 134【应用】DFS 回溯：N 皇后方案数 */
#include <stdio.h>

static int n, cnt = 0;
static int col[15], d1[30], d2[30];

static void dfs(int r)
{
    int c;
    if (r == n) { ++cnt; return; }
    for (c = 0; c < n; ++c) {
        if (col[c] || d1[r + c] || d2[r - c + n]) continue;
        col[c] = d1[r + c] = d2[r - c + n] = 1;
        dfs(r + 1);
        col[c] = d1[r + c] = d2[r - c + n] = 0;
    }
}

int main(void)
{
    scanf("%d", &n);
    dfs(0);
    printf("%d\n", cnt);
    return 0;
}
```

:::

::: details 练习 4 · 朋友与查询（并查集）（题面与样例）

有 n 个人，m 次操作。`1 a b` 表示 a 和 b 成为朋友（关系可传递），`2 a b` 询问两人是否在同一个朋友圈，输出 `Yes` 或 `No`。

**输入**：第一行 n m，随后 m 行每行三个整数。  
**输出**：每个询问一行。

**样例**

输入：
```text
5 5
1 1 2
1 3 4
2 1 2
2 1 3
2 4 3
```
输出：
```text
Yes
No
Yes
```

并查集只有两个动作：`find(x)` 找根，合并时把一棵树的根挂到另一棵上。

`find` 用路径压缩写法：一边往上找，一边把沿途结点直接挂到根上，下次就快了。写成 `while (f[x] != x) { f[x] = f[f[x]]; x = f[x]; }` 三行就够，比递归版更省栈。

:::

::: details 练习 4 · 参考代码

```c
/* 135【应用】并查集：合并与查询 */
#include <stdio.h>

static int f[100005];

static int find(int x)
{
    while (f[x] != x) { f[x] = f[f[x]]; x = f[x]; }
    return x;
}

int main(void)
{
    int n, m, op, a, b, i;

    scanf("%d%d", &n, &m);
    for (i = 1; i <= n; ++i) f[i] = i;

    while (m--) {
        scanf("%d%d%d", &op, &a, &b);
        int ra = find(a), rb = find(b);
        if (op == 1) {
            if (ra != rb) f[ra] = rb;
        } else {
            printf("%s\n", ra == rb ? "Yes" : "No");
        }
    }
    return 0;
}
```

:::

::: details 练习 5 · 最小生成树（Kruskal）（题面与样例）

给 n 个点 m 条无向边，求最小生成树的边权和；图不连通输出 `-1`。

**输入**：第一行 n m，随后 m 行每行 u v w。  
**输出**：权值和或 `-1`。

**样例**

输入：
```text
4 5
1 2 1
1 3 4
2 3 2
2 4 5
3 4 3
```
输出：
```text
6
```

Kruskal 三步：边按权值排序、从小到大试、两端不在同一集合就加入。

"在不在同一集合"用并查集判断，加入就是把两个集合合并。选够 n−1 条边就停；选不够说明图不连通。

这里 `Edge` 数组有两万多个元素，一定要放全局。放 `main` 里就是 2.4 MB 的栈，第 01 例的下场。

:::

::: details 练习 5 · 参考代码

```c
/* 136【应用】Kruskal 最小生成树 */
#include <stdio.h>
#include <stdlib.h>

typedef struct { int u, v, w; } Edge;

Edge e[200005];
int f[100005];

static int find(int x)
{
    while (f[x] != x) { f[x] = f[f[x]]; x = f[x]; }
    return x;
}

int cmp(const void *x, const void *y)
{
    const Edge *a = (const Edge *)x, *b = (const Edge *)y;
    return a->w - b->w;
}

int main(void)
{
    int n, m, i, used = 0;
    long long sum = 0;

    scanf("%d%d", &n, &m);
    for (i = 1; i <= n; ++i) f[i] = i;
    for (i = 0; i < m; ++i) scanf("%d%d%d", &e[i].u, &e[i].v, &e[i].w);

    qsort(e, m, sizeof(Edge), cmp);

    for (i = 0; i < m && used < n - 1; ++i) {
        int ru = find(e[i].u), rv = find(e[i].v);
        if (ru == rv) continue;
        f[ru] = rv;
        sum += e[i].w;
        ++used;
    }

    if (used != n - 1) printf("-1\n");
    else printf("%lld\n", sum);
    return 0;
}
```

:::

::: details 练习 6 · 单源最短路（Dijkstra）（题面与样例）

给 n 个点 m 条有向边和起点 s，求 s 到每个点的最短距离；不可达输出 `INF`。

**输入**：第一行 n m s，随后 m 行每行 u v w（w 为正整数）。  
**输出**：n 个距离，空格分隔。

**样例**

输入：
```text
5 6 1
1 2 2
1 3 5
2 3 1
2 4 4
3 5 3
4 5 1
```
输出：
```text
0 2 3 6 6
```

朴素 Dijkstra 是 O(n²)：每轮找"未确定点里距离最小的"，用它去更新邻居，然后把它标记为已确定。

关键是理解为什么能这么贪心：当前距离最小的点，不可能再被其他路径变短（边权非负）。有负权边时这个前提就破了，得换 Bellman-Ford 或 SPFA。

用邻接矩阵存图，n ≤ 1000 时没问题；n 到 10⁵ 就要换邻接表加堆优化。

:::

::: details 练习 6 · 参考代码

```c
/* 138【应用】Dijkstra 单源最短路（邻接矩阵） */
#include <stdio.h>

#define INF 1000000000

int w[1005][1005];
long long dist[1005];
int vis[1005];

int main(void)
{
    int n, m, s, i, j, u, v, c;

    scanf("%d%d%d", &n, &m, &s);

    for (i = 1; i <= n; ++i) {
        for (j = 1; j <= n; ++j) w[i][j] = INF;
        w[i][i] = 0;
        dist[i] = INF;
    }
    for (i = 0; i < m; ++i) {
        scanf("%d%d%d", &u, &v, &c);
        if (c < w[u][v]) w[u][v] = c;
    }

    dist[s] = 0;
    for (i = 1; i <= n; ++i) {
        int k = -1;
        for (j = 1; j <= n; ++j)
            if (!vis[j] && (k == -1 || dist[j] < dist[k])) k = j;
        if (k == -1 || dist[k] == INF) break;
        vis[k] = 1;
        for (j = 1; j <= n; ++j)
            if (dist[k] + w[k][j] < dist[j]) dist[j] = dist[k] + w[k][j];
    }

    for (i = 1; i <= n; ++i) {
        if (dist[i] == INF) printf("INF%c", i == n ? '\n' : ' ');
        else printf("%lld%c", dist[i], i == n ? '\n' : ' ');
    }
    return 0;
}
```

:::

## 本章小结

三类结构，三种用处：**栈**管"最近的相关项"（逆波兰、单调栈、单调队列），**队列**管"按层推进"（BFS），**并查集**管"是不是一伙的"。

这一章的代码量比前面大，但套路很稳定。写不出来的时候，先在纸上把前五步画出来，多半就知道该写什么了。

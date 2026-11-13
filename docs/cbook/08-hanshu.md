---
title: 第 8 章 · 函数与递归
series: C语言
seriesOrder: 8
---

函数是代码的复用单元：把一段逻辑包个名字，哪里需要哪里调。OJ 题里出现「编子函数」「编主函数」时，平台往往已给好另一半骨架——看清函数签名和职责边界，只写自己那部分。

**递归**是函数调用自己。每个递归要回答两个问题：

- **出口**：什么情况下直接返回，不再往下调（没有出口就是栈溢出）。
- **转移**：大问题怎么拆成同构的小问题（gcd(n, m) = gcd(m, n % m)）。

```c
int gcd(int n, int m) {
    if (m <= n && n % m == 0) return m;   /* 出口 */
    if (n < m) return gcd(m, n);          /* 调整方向 */
    return gcd(m, n % m);                 /* 转移 */
}
```

递归和循环常常可以互换：累加和、回文判断既能 while 也能递归。判断「字符串是否回文」的递归写法特别能训练出口意识——left ≥ right 时返回真，两端字符不等时返回假，否则收缩区间再问自己一次。

迭代与递归的分界也值得体会：平方根用牛顿迭代（while 直到误差达标），是「迭代逼近」；函数值 f(n) 按 f(n-1)、f(n-2) 定义，是「递归展开」。看到题目给定义式，就用递归；看到「误差」「精度」，就用迭代。

本章共 8 道题：2 道精讲例题 + 6 道自选练习。

## 精讲例题

### 例题 1 · 递归版最大公约数

按定义 GCD(n, m)：m ≤ n 且 n % m == 0 时为 m；n < m 时 GCD(m, n)；否则 GCD(m, n % m)。用递归实现，输入 n 和 m，输出最大公约数。

**输入**：两个正整数。  
**输出**：最大公约数，如输入 `24 48` 输出 `24`。

**样例**

输入：
```text
24 48
```
输出：
```text
24
```

**样例**

输入：
```text
13 15
```
输出：
```text
1
```

**思路**：辗转相除的递归三件套都在上面代码里：出口（整除即答案）、方向调整（保证 n ≥ m）、转移（gcd(m, n % m)）。把数学定义逐字翻成 if + return，就是递归入门最稳的第一步。

```c
/* 51【中学】求最大公约数——递归 */
#include <stdio.h>

int gcd(int n, int m)
{
    if (m <= n && n % m == 0) return m;
    if (n < m) return gcd(m, n);
    return gcd(m, n % m);
}

int main(void)
{
    int n, m;

    if (scanf("%d %d", &n, &m) != 2) return 0;
    printf("%d\n", gcd(n, m));
    return 0;
}
```

### 例题 2 · 递归判回文

用递归判断一个字符串是否回文（正读反读相同，如 LeveL）。输出 `Yes` 或 `No`；空串按回文处理。

**输入**：一行字符串。  
**输出**：`Yes` 或 `No`。

**样例**

输入：
```text
LeveL
```
输出：
```text
Yes
```

**样例**

输入：
```text

```
输出：
```text
Yes
```

**思路**：回文递归两个出口：left >= right（收缩完了）返回真；s[left] != s[right] 返回假。其余情况把区间两端各收一格继续问。空串和单字符天然是回文，恰好被 left >= right 覆盖。

注意判据只比较位置对，不做任何循环——递归的「循环」藏在函数调用栈里。

```c
/* 52【字符】回文字符串——递归 */
#include <stdio.h>
#include <string.h>

int is_palindrome(const char *s, int left, int right)
{
    if (left >= right) return 1;
    if (s[left] != s[right]) return 0;
    return is_palindrome(s, left + 1, right - 1);
}

int main(void)
{
    char s[1024];

    if (!fgets(s, sizeof(s), stdin)) {
        printf("Yes\n");
        return 0;
    }
    s[strcspn(s, "\r\n")] = '\0';
    printf("%s\n", is_palindrome(s, 0, (int)strlen(s) - 1) ? "Yes" : "No");
    return 0;
}
```

## 自选练习

先自己想、自己写，写完再打开参考代码对一对。每题都是「题面」与「代码」两个折叠块。

::: details 练习 1 · 两个日期隔几天（题面与样例）
写主函数（平台已提供日期辅助函数时直接调用），输入起始与终止两个日期（年月日，终止不早于起始），输出相差天数。

**输入**：两行，各「年 月 日」。  
**输出**：一行，形如 `10 days`。

提示：同年直接减「年内第几天」；跨年先算到年底，再逐个加整年（区分 365/366），最后加终止日期的年内天数。

**样例**

输入：
```text
2013 1 2
2013 1 12
```
输出：
```text
10 days
```

**样例**

输入：
```text
2013 1 31
2013 2 2
```
输出：
```text
2 days
```

:::

::: details 练习 1 · 两个日期隔几天（参考代码）
```c
/* 46【日期】计算天数（编主函数）：本题只需提交主函数，子函数由平台给出
 * 本文件给出可直接编译运行的完整版本：主函数 + 需要的辅助函数 */
#include <stdio.h>

/* 判断闰年 */
int is_leap_year(int y)
{
    return (y % 4 == 0 && y % 100 != 0) || y % 400 == 0;
}

/* 某年某月某日是该年的第几天 */
int day_of_year(int y, int m, int d)
{
    int mon[12] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    int i, sum = 0;

    for (i = 0; i < m - 1; ++i) sum += mon[i];
    if (m > 2 && is_leap_year(y)) sum += 1;
    return sum + d;
}

/* 主函数：读入两个日期，输出相差天数 */
int main(void)
{
    int y1, m1, d1, y2, m2, d2;
    int days = 0, y;

    if (scanf("%d %d %d", &y1, &m1, &d1) != 3) return 0;
    if (scanf("%d %d %d", &y2, &m2, &d2) != 3) return 0;

    if (y1 == y2) {
        days = day_of_year(y2, m2, d2) - day_of_year(y1, m1, d1);
    } else {
        days = day_of_year(y1, 12, 31) - day_of_year(y1, m1, d1);
        for (y = y1 + 1; y < y2; ++y)
            days += is_leap_year(y) ? 366 : 365;
        days += day_of_year(y2, m2, d2);
    }
    printf("%d days\n", days);
    return 0;
}
```
:::

::: details 练习 2 · 孪生素数搜索（题面与样例）
若 n 与 n+2 都是素数，称一对孪生素数。给定区间 [lo, hi]，输出区间内所有孪生素数对，每行一对，格式如 `11,13`。平台的 main 已给出，你只需实现 isPrime 函数（本地调试时再自己补 main）。

**输入**：两个整数 lo hi。  
**输出**：每对一行。

**样例**

输入：
```text
10 20
```
输出：
```text
11,13
17,19
```

**样例**

输入：
```text
100 200
```
输出：
```text
101,103
107,109
137,139
149,151
179,181
191,193
197,199
```

:::

::: details 练习 2 · 孪生素数搜索（参考代码）
```c
/* 47【中学】孪生素数：平台已给出 main，只需 isPrime；此处给出完整可编译版本 */
#include <stdio.h>

int isPrime(int n)
{
    int i;

    if (n < 2) return 0;
    for (i = 2; (long long)i * i <= n; ++i)
        if (n % i == 0) return 0;
    return 1;
}

int main(void)
{
    int lo, hi, n;

    if (scanf("%d %d", &lo, &hi) != 2) return 0;
    for (n = lo; n + 2 <= hi; ++n)
        if (isPrime(n) && isPrime(n + 2))
            printf("%d,%d\n", n, n + 2);
    return 0;
}
```
:::

::: details 练习 3 · 两层楼找路（题面与样例）
两层楼各有 10×10 网格：0 障碍、1 可走、2 楼梯（上下两层同坐标互通）、223 起点（二层）、7 终点（一层）。从起点走到终点，只许上下左右移动。找到唯一路线后输出一个 10×10 标记图：二层的路线标 2，一层的标 1，两层都经过的格子标 12，换楼的楼梯格标 +，起点标 xx，终点标 7，其余 0。无路可走时输出 `世上本没有路......`。

**输入**：21 行——前 10 行二层地图、空一行、后 10 行一层地图。  
**输出**：标记图（每个格子占 4 字符宽），或无路提示。

提示：递归 DFS + 回溯；换层发生在楼梯格，回溯时要连标记一起撤销。

**样例**

输入：
```text
   1   1   1   1   1   1   1   1   0   0
   1   0   0   0   0   0   0   1   2   0
   1   0  223  1   1   1   1   0   1   0
   1   0   1   0   0   1   1   0   1   0
   1   0   1   0   1   1   1   0   1   0
   1   0   1   0   0   0   0   0   1   0
   2   0   1   1   1   1   1   1   1   0
   1   0   1   0   0   0   0   0   0   1
   1   0   0   1   1   1   1   2   0   1
   1   1   1   1   0   0   0   0   1   0
   
   1   1   1   1   0   1   1   1   1   0
   1   0   1   0   0   0   0   0   2   0
   1   0   0   1   1   1   1   1   0   0
   1   0   0   1   0   0   0   1   0   0
   1   0   0   1   0   7   1   1   0   0
   1   0   1   1   0   0   0   1   0   0
   2   1   0   0   0   0   0   1   0   1
   0   0   1   1   1   1   1   1   0   1
   0   0   0   0   0   0   0   2   0   1
   0   0   0   0   0   0   0   0   1   0
```
输出：
```text
   2   2   2   2   2   2   2   2   0   0
   2   0   0   0   0   0   0   2   2   0
   2   0  xx   0   0   0   0   0   2   0
   2   0   2   0   0   0   0   0   2   0
   2   0   2   0   0   7   1   1   2   0
   2   0   2   0   0   0   0   1   2   0
   2   0   2   2   2   2   2  12   2   0
   2   0   0   0   0   0   0   1   0   0
   2   0   0   2   2   2   2   +   0   0
   2   2   2   2   0   0   0   0   0   0
```

**样例**

输入：
```text
   2   0  223  0   0   0   0   0   0   0
   1   0   1   0   0   0   0   1   0   1
   1   0   1   1   1   1   1   0   0   1
   1   0   1   0   1   2   1   0   0   1
   1   0   1   0   1   1   1   0   0   1
   1   0   1   0   0   0   0   0   0   1
   1   0   1   0   1   1   1   1   0   1
   1   0   1   0   0   0   0   0   0   1
   1   0   0   1   0   1   0   0   0   1
   1   1   1   1   1   1   1   1   1   2
   
   2   1   1   1   1   1   1   1   0   0
   0   0   0   0   0   0   0   7   0   0
   1   1   1   1   1   0   0   0   0   0
   1   0   0   0   1   2   0   1   0   0
   1   0   0   0   1   0   0   1   0   0
   1   1   1   1   1   0   0   1   0   0
   0   0   0   0   0   0   0   1   0   0
   0   1   1   1   1   1   1   0   0   0
   0   0   0   0   0   0   1   1   1   1
   0   0   0   0   0   0   0   0   0   2
```
输出：
```text
世上本没有路......
```

:::

::: details 练习 3 · 两层楼找路（参考代码）
```c
/* H17【同学出题】文萃导航：二维（两层）地图上搜索唯一路径，按层标记输出
 * 地图值为 223（起点，二层）、7（终点，一层）、2（楼梯，两层同坐标互通）、1（通路）、0（障碍） */
#include <stdio.h>
#include <string.h>

static int A[12][12], B[12][12];      /* A：二层（前十行），B：一层（后十行） */
static int onA[12][12], onB[12][12];  /* 路径标记 */
static int cross[12][12];             /* 楼梯换层位置 */
static int visited[2][12][12];
static int startR, startC, endR, endC;
static const int DR[4] = {-1, 1, 0, 0};
static const int DC[4] = {0, 0, -1, 1};

static int passable(int floor, int r, int c)
{
    if (r < 1 || r > 10 || c < 1 || c > 10) return 0;
    return (floor == 0 ? A[r][c] : B[r][c]) != 0;
}

/* 深度优先搜索唯一路径；floor: 0=二层, 1=一层 */
static int dfs(int floor, int r, int c, int pr, int pc, int pf)
{
    int d;
    int mapv = (floor == 0 ? A[r][c] : B[r][c]);

    if (visited[floor][r][c]) return 0;
    visited[floor][r][c] = 1;

    if (floor == 0) onA[r][c] = 1;
    else onB[r][c] = 1;
    if (pf != -1 && pf != floor) cross[r][c] = 1;   /* 从另一层楼梯上来 */

    if (floor == 1 && B[r][c] == 7) return 1;

    for (d = 0; d < 4; ++d) {
        int nr = r + DR[d], nc = c + DC[d];
        if (!passable(floor, nr, nc)) continue;
        if (dfs(floor, nr, nc, r, c, floor)) return 1;
    }
    /* 楼梯：同坐标切换到另一层 */
    if (mapv == 2 && passable(1 - floor, r, c)) {
        if (dfs(1 - floor, r, c, r, c, floor)) return 1;
    }

    /* 回溯 */
    if (floor == 0) onA[r][c] = 0;
    else onB[r][c] = 0;
    if (pf != -1 && pf != floor) cross[r][c] = 0;
    visited[floor][r][c] = 0;
    return 0;
}

int main(void)
{
    int i, j;

    for (i = 1; i <= 10; ++i)
        for (j = 1; j <= 10; ++j) {
            if (scanf("%d", &A[i][j]) != 1) return 0;
            if (A[i][j] == 223) { startR = i; startC = j; }
        }
    for (i = 1; i <= 10; ++i)
        for (j = 1; j <= 10; ++j) {
            if (scanf("%d", &B[i][j]) != 1) return 0;
            if (B[i][j] == 7) { endR = i; endC = j; }
        }

    memset(visited, 0, sizeof(visited));
    if (!dfs(0, startR, startC, 0, 0, -1)) {
        printf("世上本没有路......\n");
        return 0;
    }

    for (i = 1; i <= 10; ++i) {
        for (j = 1; j <= 10; ++j) {
            char cell[8];
            if (i == startR && j == startC) strcpy(cell, "xx");
            else if (i == endR && j == endC) strcpy(cell, "7");
            else if (cross[i][j]) strcpy(cell, "+");
            else if (onA[i][j] && onB[i][j]) strcpy(cell, "12");
            else if (onA[i][j]) strcpy(cell, "2");
            else if (onB[i][j]) strcpy(cell, "1");
            else strcpy(cell, "0");
            printf("%4s", cell);
        }
        putchar('\n');
    }
    return 0;
}
```
:::

::: details 练习 4 · 递归版累加和（题面与样例）
不许用循环，用递归求 n 到 m 的累加和（n ≤ m）。

**输入**：两个整数 n m。  
**输出**：一行，形如 `The sum from 1 to 10 is 55.`

**样例**

输入：
```text
1 10
```
输出：
```text
The sum from 1 to 10 is 55.
```

**样例**

输入：
```text
10 15
```
输出：
```text
The sum from 10 to 15 is 75.
```

:::

::: details 练习 4 · 递归版累加和（参考代码）
```c
/* 48【小学】求累加和：用递归求 n 到 m 的累加和 */
#include <stdio.h>

int sum_rec(int cur, int m)
{
    if (cur > m) return 0;
    return cur + sum_rec(cur + 1, m);
}

int main(void)
{
    int n, m;

    if (scanf("%d %d", &n, &m) != 2) return 0;
    printf("The sum from %d to %d is %d.\n", n, m, sum_rec(n, m));
    return 0;
}
```
:::

::: details 练习 5 · 按定义递归求项（题面与样例）
数列定义：n 在 0～4 时 f(n) = 1；n > 4 且为偶数时 f(n) = f(n-1) + f(n-3)；n > 4 且为奇数时 f(n) = f(n-2) + f(n-4)；其余（n < 0）f(n) = -1。输入 n，输出 f(n)。

**输入**：一个整数 n。  
**输出**：f(n) 的值，如输入 10 输出 8。

**样例**

输入：
```text
10
```
输出：
```text
8
```

:::

::: details 练习 5 · 按定义递归求项（参考代码）
```c
/* 49【大学】函数递归：按分段定义递归求第 n 项 */
#include <stdio.h>

int findf(int n)
{
    if (n >= 0 && n <= 4) return 1;
    if (n > 4) {
        if (n % 2 == 0) return findf(n - 1) + findf(n - 3);
        else return findf(n - 2) + findf(n - 4);
    }
    return -1;                 /* n < 0 */
}

int main(void)
{
    int n;

    if (scanf("%d", &n) != 1) return 0;
    printf("%d\n", findf(n));
    return 0;
}
```
:::

::: details 练习 6 · 迭代求平方根（题面与样例）
用牛顿迭代公式 p = (p + x/p) / 2 求 x 的平方根：反复迭代，直到 p² 与 x 的误差小于给定精度 e。输出结果，保留 8 位小数。

**输入**：一行两个数：x 和 e（如 `10.0 1e-8`）。  
**输出**：一行，形如 `3.16227766`。

**样例**

输入：
```text
4
1e-8
```
输出：
```text
2.00000000
```

**样例**

输入：
```text
0.25
1e-8
```
输出：
```text
0.50000000
```

:::

::: details 练习 6 · 迭代求平方根（参考代码）
```c
/* 50【大学】求解平方根：牛顿迭代 p = (p + x/p)/2，直到 |p*p - x| < e */
#include <stdio.h>
#include <math.h>

int main(void)
{
    double x, e, p;

    if (scanf("%lf %lf", &x, &e) != 2) return 0;

    if (x <= 0) {
        p = 0;
    } else {
        p = x > 1 ? x : 1.0;
        while (fabs(p * p - x) >= e)
            p = (p + x / p) / 2.0;
    }
    printf("%.8f\n", p);
    return 0;
}
```
:::

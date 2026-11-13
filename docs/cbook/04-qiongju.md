---
title: 第 4 章 · 穷举与递推
---

# 第 4 章 · 穷举与递推

穷举（枚举）和递推是两个看起来朴素、实战中极能打的策略。

**穷举**：答案在有限的候选集合里，那就把候选一个一个试。穷举的功力体现在「枚举什么」：把四个未知数都枚举是四重循环，往往上千倍地慢；枚举其中两三个、剩下用方程解出来，循环层数立刻降下来。枚举顺序和范围划得准，程序就又快又短。

**递推**：很多数列和过程题不必回头找公式，只要知道「下一项怎么从已有项算出来」。斐波那契、模拟过程、逐段扫描，本质都是递推：确定初始值 + 确定转移规则 + 循环推进。递推通常只需要保存常数个「上一项」，空间几乎为零。

```c
long long f[MAXD] = {1, 1};
for (int i = 2; i <= d; ++i)
    f[i] = f[i - 1] + f[i - 2];   /* 斐波那契式递推 */
```

这两类题还经常埋着**数据范围**的考题：答案超出 int 时要换 long long，超出 long long（比如斐波那契到 100 项）就要上「大数」——用数组存每一位数字手工进位。看到「10⁶」「100 项」这类字眼，先估一估答案会不会爆。

本章共 9 道题：2 道精讲例题 + 7 道自选练习。

## 精讲例题

### 例题 1 · 外卖满减凑单

某店外卖有 4 种单品，价格和库存给定，小明要凑满一个目标金额恰好花完（多退少补都不行，必须正好）。输出所有恰好组合，或输出无解提示。

**输入**：4 种单价、各自库存、目标金额（以题面样例为准）。  
**输出**：所有恰好组合；无解输出 `no solution` 一类的提示（以样例为准）。

提示：枚举前三种的数量，第四种直接由总金额倒推并检查库存与下限。

**样例**

输入：
```text
10 200
```
输出：
```text
KFC  McDonald  PissaHut
10 0 0
```

**思路**：四样东西各买多少件是四个未知数，最笨的写法是四重循环。更好的做法是枚举前三样，第四样直接由总价倒推——循环从四层降到三层，效率差一个数量级。

穷举题先问自己：哪些量可以由其余量推出？能推就不枚举。

```c
/* 37【中学】小明做外卖：20a+12b+8c=m, a+b+c=n，按 a 降序、b 降序输出 */
#include <stdio.h>

int main(void)
{
    int n, m;

    printf("KFC  McDonald  PissaHut\n");
    while (scanf("%d %d", &n, &m) == 2) {
        int a, found = 0;
        for (a = n; a >= 0; --a) {
            int rest = m - 8 * n - 12 * a;   /* 12a + 4b = m - 8n */
            int b, c;
            if (rest % 4 != 0) continue;
            b = rest / 4;
            c = n - a - b;
            if (b < 0 || c < 0) continue;
            printf("%d %d %d\n", a, b, c);
            found = 1;
        }
        if (!found) printf("No Solution！\n");
    }
    return 0;
}
```

### 例题 2 · 贪吃的猴子

猴子第一天摘了若干桃子，之后每天按给定规则变化（吃掉一半再多吃一个之类的规则，以题面为准），问第 n 天还剩多少，或按规则倒推回第一天摘了多少。

**输入**：按题面样例给定的参数。  
**输出**：按题面要求输出结果。

这是最典型的递推题：写出「今天的量 = f(昨天的量)」，循环 n 次即可。

**样例**

输入：
```text
3
```
输出：
```text
The monkey got 14 peaches in the first day.
```

**样例**

输入：
```text
1
```
输出：
```text
The monkey got 1 peach in the first day.
```

**思路**：猴子吃桃式递推——从最后一天的状态倒推回第一天，或从第一天顺推到第 n 天，转移规则题面里已经给全。数组只留常数个变量就够，重点是把题面的过程描述一字不差地翻成循环体。

```c
/* 41【中学】贪吃的猴子：第 k 天吃剩下的一半再加 k 个，第 n 天剩 1 个 -> 倒推 */
#include <stdio.h>

int main(void)
{
    int n, k;
    long long peaches = 1;   /* 第 n 天早上剩下的桃子 */

    if (scanf("%d", &n) != 1) return 0;
    for (k = n - 1; k >= 1; --k)
        peaches = 2 * (peaches + k);

    if (peaches == 1)
        printf("The monkey got 1 peach in the first day.\n");
    else
        printf("The monkey got %lld peaches in the first day.\n", peaches);
    return 0;
}
```

## 自选练习

先自己想、自己写，写完再打开参考代码对一对。每题都是「题面」与「代码」两个折叠块。

::: details 练习 1 · 满减促销怎么买（题面与样例）
商店搞促销：不同商品有不同价格与库存，顾客带了一笔钱，要求列出所有「把钱花到恰好为 0」的购买方案（每种商品买几件），按某种顺序输出，无方案给提示。

**输入**：商品价格、库存与预算（以题面样例为准）。  
**输出**：全部方案，或无解提示。

这题和「外卖凑单」同一套路：能由方程推出的维度绝不进循环。

**样例**

输入：
```text
12,360,54,26
2018
```
输出：
```text
1,1,4,55
1,1,17,28
1,2,6,37
1,3,8,19
2,2,13,22
2,4,4,13
3,3,9,16
4,4,5,10
```

:::

::: details 练习 1 · 满减促销怎么买（参考代码）
```c
/* 38【应用】促销：四种礼品数量非递减，总价等于中奖金额，穷举所有方案 */
#include <stdio.h>

int main(void)
{
    int p1, p2, p3, p4, total;
    int a, b, c, d;

    if (scanf("%d,%d,%d,%d", &p1, &p2, &p3, &p4) != 4) return 0;
    if (scanf("%d", &total) != 1) return 0;

    for (a = 1; a * (p1 + p2 + p3 + p4) <= total; ++a) {
        for (b = a; a * p1 + b * (p2 + p3 + p4) <= total; ++b) {
            for (c = b; a * p1 + b * p2 + c * (p3 + p4) <= total; ++c) {
                int rest = total - a * p1 - b * p2 - c * p3;
                if (rest % p4 != 0) continue;
                d = rest / p4;
                if (d < c) continue;
                printf("%d,%d,%d,%d\n", a, b, c, d);
            }
        }
    }
    return 0;
}
```
:::

::: details 练习 2 · 井底的青蛙（题面与样例）
井深 H 米。青蛙白天向上爬 U 米，夜里睡着会滑落 D 米（U > D）。问第几天能爬出井口。注意最后一天白天爬到顶就算出井，不会再滑落。

**输入**：三个整数 H U D。  
**输出**：所需天数。

**样例**

输入：
```text
9 9 8
```
输出：
```text
青蛙能爬出井，且第 1 天爬出井。
```

**样例**

输入：
```text
4 5 8
```
输出：
```text
青蛙不能爬出井。
```

:::

::: details 练习 2 · 井底的青蛙（参考代码）
```c
/* 39【小学】青蛙出井：第 i 天爬 n-i+1 米，每天结束下滑 m 米 */
#include <stdio.h>

int main(void)
{
    int n, m, x;
    int day, pos = 0;

    if (scanf("%d %d %d", &n, &m, &x) != 3) return 0;

    for (day = 1; day <= 1000; ++day) {
        int climb = n - day + 1;
        if (climb <= 0) break;
        pos += climb;
        if (pos >= x) {
            printf("青蛙能爬出井，且第 %d 天爬出井。\n", day);
            return 0;
        }
        pos -= m;
        if (pos < 0) pos = 0;
    }
    printf("青蛙不能爬出井。\n");
    return 0;
}
```
:::

::: details 练习 3 · 倒计时几天（题面与样例）
输入两个日期（起始、终止，终止不早于起始），输出相隔多少天。跨年、闰年都要处理对。

**输入**：两行，每行「年 月 日」。  
**输出**：一行，形如 `10 days`。

提示：把两个日期各自换算成「从某个基准日起的天数」再相减，闰年判断单独写个小函数，代码最干净。

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

::: details 练习 3 · 倒计时几天（参考代码）
```c
/* 40【日期】倒计时到底有几天：求两个日期之间的天数差 */
#include <stdio.h>

static int is_leap(int y)
{
    return (y % 4 == 0 && y % 100 != 0) || y % 400 == 0;
}

static int day_of_year(int y, int m, int d)
{
    static const int mon[12] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    int i, sum = 0;

    for (i = 0; i < m - 1; ++i)
        sum += mon[i];
    if (m > 2 && is_leap(y)) sum += 1;
    return sum + d;
}

/* 以公元 1 年 1 月 1 日为原点计算绝对天数 */
static long long abs_days(int y, int m, int d)
{
    long long days = 0;
    int i;

    for (i = 1; i < y; ++i)
        days += is_leap(i) ? 366 : 365;
    return days + day_of_year(y, m, d);
}

int main(void)
{
    int y1, m1, d1, y2, m2, d2;
    long long diff;

    if (scanf("%d %d %d %d %d %d", &y1, &m1, &d1, &y2, &m2, &d2) != 6) return 0;
    diff = abs_days(y2, m2, d2) - abs_days(y1, m1, d1);
    printf("%lld days\n", diff);
    return 0;
}
```
:::

::: details 练习 4 · 行酒令（题面与样例）
聚会玩行酒令：遇到与 7 有关的数就要拍手——「与 7 有关」指该数是 7 的倍数，或者它的十进制表示里有数字 7。给定区间 [A, B]（可能很大，也可能含负数），统计其中与 7 有关的数有多少个。

**输入**：两个整数 A B。  
**输出**：个数。

注意：负数取绝对值后判断即可；区间可能很长，判断函数要写得快。

**样例**

输入：
```text
0 7
```
输出：
```text
2
```

**样例**

输入：
```text
71 72
```
输出：
```text
2
```

:::

::: details 练习 4 · 行酒令（参考代码）
```c
/* 46【学长出题】行酒令：统计 [A,B] 中"含 7 或是 7 的倍数"的个数 */
#include <stdio.h>
#include <stdlib.h>

static int hit(long long v)
{
    long long t = v < 0 ? -v : v;

    if (t % 7 == 0) return 1;
    while (t > 0) {
        if (t % 10 == 7) return 1;
        t /= 10;
    }
    return 0;
}

int main(void)
{
    long long a, b, i, cnt = 0;

    if (scanf("%lld %lld", &a, &b) != 2) return 0;
    for (i = a; i <= b; ++i)
        if (hit(i)) ++cnt;
    printf("%lld\n", cnt);
    return 0;
}
```
:::

::: details 练习 5 · 最长的相同段（题面与样例）
输入 n 和 n 个整数，找出最长的「连续相等段」的首尾下标（0 起）。长度相同的取最靠前的。不存在长度 ≥ 2 的相等段时输出 `No equal number list.`

**输入**：第一行 n，第二行 n 个整数。  
**输出**：一行，形如 `The longest equal number list is from 2 to 4.`，或 `No equal number list.`

**样例**

输入：
```text
5
1 2 3 4 5
```
输出：
```text
No equal number list.
```

**样例**

输入：
```text
6
1 0 1 1 1 0
```
输出：
```text
The longest equal number list is from 2 to 4.
```

:::

::: details 练习 5 · 最长的相同段（参考代码）
```c
/* 49【数列】等值数列段：输出最长等值段的首尾下标（长度相同时取第一个） */
#include <stdio.h>

int main(void)
{
    int n, a[60], i;
    int bestLen = 0, bestStart = 0, bestEnd = 0;

    if (scanf("%d", &n) != 1) return 0;
    for (i = 0; i < n; ++i)
        if (scanf("%d", &a[i]) != 1) return 0;

    i = 0;
    while (i < n) {
        int j = i;
        while (j + 1 < n && a[j + 1] == a[i]) ++j;
        if (j - i + 1 >= 2 && j - i + 1 > bestLen) {
            bestLen = j - i + 1;
            bestStart = i;
            bestEnd = j;
        }
        i = j + 1;
    }
    if (bestLen == 0)
        printf("No equal number list.\n");
    else
        printf("The longest equal number list is from %d to %d.\n", bestStart, bestEnd);
    return 0;
}
```
:::

::: details 练习 6 · 蜂窝上的蜜蜂（题面与样例）
蜜蜂在蜂窝上爬行，只能从 i 号格子走到 i+1 或 i+2 号格子。问从 a 号爬到 b 号（a < b，均在 1～100）有多少种路线。

**输入**：两个整数 a b。  
**输出**：路线总数。

距离 d = b - a 时方案数是斐波那契式递推：g(0)=g(1)=1，g(d)=g(d-1)+g(d-2)。d 到 99 时答案远超 long long，要写大数加法。

**样例**

输入：
```text
1 4
```
输出：
```text
3
```

**样例**

输入：
```text
1 5
```
输出：
```text
5
```

:::

::: details 练习 6 · 蜂窝上的蜜蜂（参考代码）
```c
/* H14【游戏】小蜜蜂：从 a 到 b 只能走到 a+1 或 a+2，方案数满足斐波那契式递推 */
#include <stdio.h>

#define MAXD 120

/* 大整数加法（十进制字符串，低位在前） */
static void add_big(int *r, const int *x, const int *y)
{
    int i, carry = 0;

    for (i = 0; i < MAXD; ++i) {
        int s = x[i] + y[i] + carry;
        r[i] = s % 10;
        carry = s / 10;
    }
}

int main(void)
{
    int a, b, d, i, k;
    int f[MAXD] = {0}, g[MAXD] = {0}, h[MAXD] = {0};

    if (scanf("%d %d", &a, &b) != 2) return 0;
    d = b - a;

    f[0] = 1;                       /* g(0) = 1 */
    g[0] = 1;                       /* g(1) = 1 */
    if (d == 0) { printf("1\n"); return 0; }

    for (i = 2; i <= d; ++i) {
        add_big(h, f, g);
        for (k = 0; k < MAXD; ++k) { f[k] = g[k]; g[k] = h[k]; }
    }

    for (i = MAXD - 1; i > 0 && g[i] == 0; --i) ;
    for (; i >= 0; --i) putchar('0' + g[i]);
    putchar('\n');
    return 0;
}
```
:::

::: details 练习 7 · 最长降温区间（题面与样例）
给出连续 n 天的温度，找最长的连续段，使得段内温度一天不高于一天（允许相等）。输出段的首尾天数（1 起）；多个答案取开头最早的那个。

**输入**：第一行 n（可达 10⁶），第二行 n 个整数。  
**输出**：两个整数 l 和 r。

一遍扫描即可：温度上升时重置段起点，随时记录最长段。数据量大，读入也用较快的输入方式。

**样例**

输入：
```text
5
1 2 3 4 5
```
输出：
```text
1 1
```

**样例**

输入：
```text
6
1 4 3 2 2 5
```
输出：
```text
2 5
```

:::

::: details 练习 7 · 最长降温区间（参考代码）
```c
/* 44【学长出题】寒冷的北京：求最长的"一直降温（允许相等）"区间，输出 l r */
#include <stdio.h>

int main(void)
{
    static int t[1000005];
    int n, i;
    int bestL = 1, bestR = 1, curL = 1;

    if (scanf("%d", &n) != 1) return 0;
    for (i = 0; i < n; ++i)
        if (scanf("%d", &t[i]) != 1) return 0;

    for (i = 1; i < n; ++i) {
        if (t[i] > t[i - 1]) curL = i + 1;   /* 升温则重新开始 */
        if (i + 1 - curL > bestR - bestL) {  /* 更长才更新，保证 l 最小 */
            bestL = curL;
            bestR = i + 1;
        }
    }
    printf("%d %d\n", bestL, bestR);
    return 0;
}
```
:::

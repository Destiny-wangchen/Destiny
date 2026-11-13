---
title: 第 5 章 · 图形输出
series: C语言
seriesOrder: 5
---

图形输出是循环与分支的「看图作文」：把一个图案翻译成两层循环——外层管行，内层管列。做题时拿张草稿纸，把行号、列号、空格数、字符数之间的函数关系写出来，代码就出来了。

三个通用的观察角度：

- **对称**：实心/空心的判断往往落在「距中心或边缘的距离」上。用 `abs()` 把行列坐标折算成距离，条件式立刻变短。
- **规律找公式，不找巧合**：三角形每行空格数是 h-1-i、星号数是 2i+1，这类线性关系要推出来，而不是拿三个 if 硬凑。
- **字符是数字**：字母图形用 `(char)('A' + k % 26)` 循环取字母，配合取余实现「Z 之后回到 A」。

```c
for (i = 0; i < n; ++i) {          /* 第 i 行 */
    for (j = 0; j < n - 1 - i; ++j) putchar(' ');   /* 先铺空格 */
    for (j = 0; j < 2 * i + 1; ++j) putchar('*');   /* 再铺星号 */
    putchar('\n');
}
```

空心图形是实心版的进阶：把「这一格要不要放字符」变成一个判断——通常等价于「我在不在边界上」。判断写对了，实心版和空心版只差一个 if。

本章共 4 道题：2 道精讲例题 + 2 道自选练习。

## 精讲例题

### 例题 1 · 空心数字梯形

输出一个空心数字梯形：每行宽度递增、数字按 0~9 循环递增、内部镂空，底边是连续数字行。具体形状、起始数字 s 与行数等参数的含义以样例为准。

**输入**：起始数字与行数等参数（见样例）。  
**输出**：图形，行末无多余空格。

**样例**

输入：
```text
5 5
```
输出：
```text
5 6 7 8 9 0 1 0 9 8 7 6 5
  6                   6
    7               7
      8           8
        9 0 1 0 9
```

**样例**

输入：
```text
1 0
```
输出：
```text
0
```

**思路**：先把梯形拆成三段——上三角、下三角、底边——分别推导每行数字的起始值与递增步长，底边还带连续回绕。核心工具是 `(s + i + k) % 10`：起始值 s 加行偏移 i 加列偏移 k，对 10 取余实现 0~9 循环。

写图形题的正确姿势：在草稿纸上标出第 i 行第 j 列该打印什么，推出通项再动键盘。

```c
/* 43【图形】空心数字梯形：上底宽 3n-2，下底宽 n，中间镂空，数字 0-9 循环 */
#include <stdio.h>

int main(void)
{
    int n, s, i, j;

    if (scanf("%d %d", &n, &s) != 2) return 0;

    for (i = 0; i < n; ++i) {
        int w = 3 * n - 2 - 2 * i;   /* 该行数字个数 */
        int indent = 2 * i;          /* 该行缩进空格数 */

        for (j = 0; j < indent; ++j) putchar(' ');

        if (i == 0 || i == n - 1) {
            /* 顶边与底边：完整数字序列，从左到右先递增再递减 */
            for (j = 0; j < w; ++j) {
                int k = j < w - 1 - j ? j : w - 1 - j;
                if (j) putchar(' ');
                printf("%d", (s + i + k) % 10);
            }
        } else {
            /* 中间行：只输出左右两条边 */
            int gap = 2 * (w - 1) - 1;
            printf("%d", (s + i) % 10);
            for (j = 0; j < gap; ++j) putchar(' ');
            printf("%d", (s + i) % 10);
        }
        putchar('\n');
    }
    return 0;
}
```

### 例题 2 · 空心字母正方形

输入 n 和一个起始字母，输出边长为 n 的空心字母正方形：四条边上的字母沿顺时针方向依次递增（Z 之后回绕到 A），小写输入统一按大写处理，内部全是空格，字母之间用一个空格分隔。

**输入**：整数 n 和一个字母。  
**输出**：n 行图形，如 n=5、起始 M 时首行是 `M N O P Q`，第二行是 `N       R`。

**样例**

输入：
```text
5 m
```
输出：
```text
M N O P Q
N       R
O       S
P       T
Q R S T U
```

**样例**

输入：
```text
3 1
```
输出：
```text
Input error!
```

**思路**：空心正方形的四条边共用一套「沿边走」的编号：上边第 j 列是 base+j，下边是 base+n-1+j，左列是 base+i，右列是 base+n-1+i。中间行只打首尾两个字母，空格数 2n-3。

把四条边的通项分别写出来再合并，比在循环里堆 if 清爽得多。

```c
/* 45【图形】空心字母正方形：边长 n，左上角字母可大写可小写，输出统一大写 */
#include <stdio.h>
#include <ctype.h>

int main(void)
{
    int n, i, j;
    char ch;

    if (scanf("%d %c", &n, &ch) != 2 || !isalpha((unsigned char)ch)) {
        printf("Input error!\n");
        return 0;
    }
    ch = (char)toupper((unsigned char)ch);

    for (i = 0; i < n; ++i) {
        if (i == 0 || i == n - 1) {
            /* 上下两条边：连续字母 */
            for (j = 0; j < n; ++j) {
                if (j) putchar(' ');
                putchar('A' + (ch - 'A' + (i == 0 ? 0 : n - 1) + j) % 26);
            }
        } else {
            /* 中间行：左右两条边 */
            putchar('A' + (ch - 'A' + i) % 26);
            for (j = 0; j < 2 * n - 3; ++j) putchar(' ');
            putchar('A' + (ch - 'A' + (n - 1) + i) % 26);
        }
        putchar('\n');
    }
    return 0;
}
```

## 自选练习

先自己想、自己写，写完再打开参考代码对一对。每题都是「题面」与「代码」两个折叠块。

::: details 练习 1 · 数字正方形（题面与样例）
输入 n，输出 n×n 的数字方阵：从 1 开始逐行铺数字，每个数字占 3 个字符宽（`%3d`），不足部分左端补空格。

**输入**：整数 n。  
**输出**：n 行方阵，如 n=3 时第一行是 `  1  2  3`。

**样例**

输入：
```text
1
```
输出：
```text
  1
```

**样例**

输入：
```text
2
```
输出：
```text
  1  2
  3  4
```

:::

::: details 练习 1 · 数字正方形（参考代码）
```c
/* 42【图形】数字正方型：输出 n×n 的连续数字矩阵，每个数字占 3 位宽 */
#include <stdio.h>

int main(void)
{
    int n, i, j, v = 1;

    if (scanf("%d", &n) != 1) return 0;
    for (i = 0; i < n; ++i) {
        for (j = 0; j < n; ++j)
            printf("%3d", v++);
        putchar('\n');
    }
    return 0;
}
```
:::

::: details 练习 2 · 倒序字母金字塔（题面与样例）
给定顶点字母和底层宽度，输出一个字母金字塔：每行宽度递增 2，同一行内字母从两端向中心先增后减（即距中心的距离决定字母），字母按倒序方向循环展开；最后统计输出整个金字塔用了多少个某个字母（以样例为准）。

**输入**：顶点字母、底层宽度、行数。  
**输出**：金字塔图形 + 统计行。

提示：一行内第 j 个字符距中心的距离 k 决定字母偏移量，字母用 base + ((ch - base - k) % 26 + 26) % 26 循环。

**样例**

输入：
```text
D 1 3
```
输出：
```text
  D
 DCD
DCBCD
所建金字塔共使用0个字母砖块Z
```

**样例**

输入：
```text
z 16 3
```
输出：
```text
  zyxwvutsstuvwxyz
 zyxwvutsrrstuvwxyz
zyxwvutsrqqrstuvwxyz
所建金字塔共使用6个字母砖块z
```

:::

::: details 练习 2 · 倒序字母金字塔（参考代码）
```c
/* 44【图形】倒序字母金字塔：每行宽度递增 2，字母由顶点字母倒序展开 */
#include <stdio.h>
#include <ctype.h>

int main(void)
{
    char ch;
    int w, h, i, j;
    long long zcount = 0;

    if (scanf(" %c %d %d", &ch, &w, &h) != 3) return 0;

    for (i = 0; i < h; ++i) {
        int width = w + 2 * i;
        char target = isupper((unsigned char)ch) ? 'Z' : 'z';
        char base = isupper((unsigned char)ch) ? 'A' : 'a';

        for (j = 0; j < h - 1 - i; ++j) putchar(' ');
        for (j = 0; j < width; ++j) {
            int k = j < width - 1 - j ? j : width - 1 - j;   /* 距顶点的距离 */
            int off = (ch - base - k) % 26;
            char c;
            if (off < 0) off += 26;
            c = (char)(base + off);
            putchar(c);
            if (c == target) ++zcount;
        }
        putchar('\n');
    }
    printf("所建金字塔共使用%lld个字母砖块%c\n", zcount,
           isupper((unsigned char)ch) ? 'Z' : 'z');
    return 0;
}
```
:::

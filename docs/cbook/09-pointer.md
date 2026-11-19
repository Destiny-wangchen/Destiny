---
title: 第 9 章 · 指针与内存
series: C语言
seriesOrder: 9
---

前面八章的变量都有一个共同点：你写 `a`，程序就知道去取哪块内存。指针把这层关系掀开——它不存数据，存的是数据的地址，于是你可以让一个函数改到调用者的变量，可以在运行期决定要多大内存，也可以用一个变量指向不同的函数。

指针本身只有两个动作：**取地址**（`&`）和**解引用**（`*`）。所有让人头大的写法，都是从这两个动作组合出来的。

必须养成的三个习惯：

- **声明时把 `*` 和变量名贴在一起**：`int *p` 读作"p 是指针"，`int *a, b` 里只有 `a` 是指针，`b` 是 `int`。
- **指针必须先有指向再用**：`int *p; *p = 1;` 是在往一个随机地址写数据，几乎必崩。要么指向已有变量，要么 `malloc`。
- **数组名退化成指针**：`a` 等价于 `&a[0]`，`a[i]` 等价于 `*(a + i)`。理解这一条，指针遍历数组就不用背了。

最容易混淆的是"指针的值"和"指针指向的值"：`p + 1` 是地址加一个元素的宽度（`int` 加 4），`*p + 1` 才是数据加一。写错一个星号，程序不报错，结果全错。

本章共 6 道题：2 道精讲例题 + 4 道自选练习。

## 精讲例题

### 例题 1 · 用指针换两个数

输入两个整数，交换它们的值后输出。要求交换动作写在一个 `void` 函数里，通过指针完成。

**输入**：两个整数。  
**输出**：交换后的两个整数，空格分隔。

**样例**

输入：
```text
3 7
```
输出：
```text
7 3
```

**思路**：C 语言的函数参数是值传递，`swap(a, b)` 只能拿到副本，改副本不影响原变量。想要改到调用者，就得把地址传进去，函数里用 `*` 顺着地址改。

先想清楚这一点：`swap(&a, &b)` 里，指针 `pa` 的值是 `a` 的地址，`*pa` 才是 `a` 本身。所以函数体三行是"存一份、覆盖、写回"，顺序不能乱，`*a = *b` 写在前就会把原来的值冲掉。

```c
/* 111【应用】指针交换：通过指针修改调用者的变量 */
#include <stdio.h>

void swap(int *a, int *b)
{
    int t = *a;
    *a = *b;
    *b = t;
}

int main(void)
{
    int a, b;
    scanf("%d%d", &a, &b);
    swap(&a, &b);
    printf("%d %d\n", a, b);
    return 0;
}
```

### 例题 2 · 动态开数组筛素数

输入 n，输出 1 到 n 之间素数的个数，以及这些素数（空格分隔）。

**输入**：一个整数 n（≤ 10⁶）。  
**输出**：第一行个数，第二行所有素数。

**样例**

输入：
```text
50
```
输出：
```text
15
2 3 5 7 11 13 17 19 23 29 31 37 41 43 47
```

**思路**：埃氏筛。开一个标记数组，从 2 开始，把每个素数的倍数全部划掉，剩下没被划掉的就是素数。

n 到了 10⁶，标记数组要 1 MB。这一章和第 01 例讲的是同一个道理：能放全局就放全局，需要运行期决定大小就用 `malloc`。这里演示 `malloc` 的写法，顺便养成检查返回值的习惯。

筛法有个容易写错的地方：内层从 `i * i` 开始，不是从 `i + i`。因为比 `i` 小的倍数早就被更小的素数划掉了，从 `i * i` 起能省一半时间。

```c
/* 114【应用】动态内存 + 埃氏筛 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void)
{
    int n, i, j, cnt = 0;
    scanf("%d", &n);

    char *is = (char *)malloc(sizeof(char) * (n + 1));
    int *pr = (int *)malloc(sizeof(int) * (n + 1));
    if (is == NULL || pr == NULL) return 0;      /* 申请失败要能退出 */

    memset(is, 1, sizeof(char) * (n + 1));
    is[0] = is[1] = 0;

    for (i = 2; i * i <= n; ++i)
        if (is[i])
            for (j = i * i; j <= n; j += i) is[j] = 0;

    for (i = 2; i <= n; ++i)
        if (is[i]) pr[cnt++] = i;

    printf("%d\n", cnt);
    for (i = 0; i < cnt; ++i)
        printf("%d%c", pr[i], i == cnt - 1 ? '\n' : ' ');

    free(is);
    free(pr);
    return 0;
}
```

## 自选练习

::: details 练习 1 · 只用指针排序（题面与样例）

输入 n 和 n 个整数，用指针遍历完成插入排序，升序输出。

**输入**：第一行 n（≤ 100），第二行 n 个整数。  
**输出**：升序序列一行，空格分隔，末尾无空格。

**样例**

输入：
```text
6
10 90 80 30 20 15
```
输出：
```text
10 15 20 30 80 90
```

用 `i < p + n` 代替 `i < n`，用 `*i` 代替 `a[i]`，把整套下标写法翻译一遍，是熟悉指针最快的方式。

:::

::: details 练习 1 · 参考代码

```c
/* 112【应用】用指针完成插入排序 */
#include <stdio.h>

void sort(int *p, int n)
{
    int *i, *j, t;
    for (i = p + 1; i < p + n; ++i) {
        t = *i;
        for (j = i - 1; j >= p && *j > t; --j)
            *(j + 1) = *j;
        *(j + 1) = t;
    }
}

int main(void)
{
    int a[105], n, i;
    scanf("%d", &n);
    for (i = 0; i < n; ++i) scanf("%d", &a[i]);
    sort(a, n);
    for (i = 0; i < n; ++i)
        printf("%d%c", a[i], i == n - 1 ? '\n' : ' ');
    return 0;
}
```

:::

::: details 练习 2 · 函数指针做四则运算（题面与样例）

输入一个运算符和两个整数，输出运算结果。要求用函数指针数组分发，而不是 `if-else` 链；除数为 0 或运算符不认识时输出 `error`。

**输入**：运算符和两个整数。  
**输出**：结果或 `error`。

**样例**

输入：
```text
* 12 5
```
输出：
```text
60
```

函数指针数组的写法：`int (*fp[256])(int, int)`，先全部置空，再把 `+ - * /` 四个字符填上对应的函数。用 `fp[c]` 直接调用，比 switch 干净。注意数组下标是 `unsigned char`，别让负数字符越界。

:::

::: details 练习 2 · 参考代码

```c
/* 113【应用】函数指针数组实现运算分发 */
#include <stdio.h>

int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }
int mul(int a, int b) { return a * b; }
int quo(int a, int b) { return a / b; }

int main(void)
{
    char op;
    int a, b;
    int (*fp[256])(int, int) = {0};

    fp['+'] = add;
    fp['-'] = sub;
    fp['*'] = mul;
    fp['/'] = quo;

    if (scanf(" %c %d %d", &op, &a, &b) != 3) return 0;

    if (fp[(unsigned char)op] == NULL || (op == '/' && b == 0)) {
        printf("error\n");
        return 0;
    }
    printf("%d\n", fp[(unsigned char)op](a, b));
    return 0;
}
```

:::

::: details 练习 3 · 子串替换（题面与样例）

输入三行：原文、被替换的子串、替换串。把原文中所有出现的位置替换掉，输出新串。

**输入**：三行字符串，每行长度 < 100，结果长度 < 500。  
**输出**：替换后的字符串。

**样例**

输入：
```text
i like apple and apple pie
apple
orange
```
输出：
```text
i like orange and orange pie
```

关键是用 `strstr` 找到位置，再用 `memcpy` 分段拼接。指针 `p` 每次跳到匹配串之后，循环条件直接写 `while ((q = strstr(p, old)) != NULL)`。读入用 `fgets`，顺便用 `strcspn` 把换行符切掉。

:::

::: details 练习 3 · 参考代码

```c
/* 115【应用】指针 + strstr 实现全局替换 */
#include <stdio.h>
#include <string.h>

int main(void)
{
    char src[105], old[105], rep[105], out[505];
    char *p = src, *q;
    int len = 0, olen;

    fgets(src, sizeof(src), stdin);
    fgets(old, sizeof(old), stdin);
    fgets(rep, sizeof(rep), stdin);
    src[strcspn(src, "\n")] = 0;
    old[strcspn(old, "\n")] = 0;
    rep[strcspn(rep, "\n")] = 0;

    olen = (int)strlen(old);
    if (olen == 0) { printf("%s\n", src); return 0; }

    while ((q = strstr(p, old)) != NULL) {
        int seg = (int)(q - p);
        memcpy(out + len, p, seg);
        len += seg;
        strcpy(out + len, rep);
        len += (int)strlen(rep);
        p = q + olen;
    }
    strcpy(out + len, p);
    printf("%s\n", out);
    return 0;
}
```

:::

::: details 练习 4 · 指针找最大值（题面与样例）

输入 n 和 n 个整数，用返回指针的函数找出最大值，同时通过指针参数带出它的下标。出现并列时取第一个。

**输入**：第一行 n（≤ 100），第二行 n 个整数。  
**输出**：`max = 值, index = 下标`。

**样例**

输入：
```text
5
3 9 1 9 7
```
输出：
```text
max = 9, index = 1
```

返回指针的函数要小心：不能返回局部变量的地址。这里 `best` 指向的是调用者传入的数组内部，函数返回后数组还在，所以安全——这和"返回局部数组"是两回事，第 08 例专门讲过。

:::

::: details 练习 4 · 参考代码

```c
/* 116【应用】返回指针的函数 + 通过指针参数带回下标 */
#include <stdio.h>

int *find_max(int *p, int n, int *idx)
{
    int *best = p, *it;
    *idx = 0;
    for (it = p + 1; it < p + n; ++it)
        if (*it > *best) {
            best = it;
            *idx = (int)(it - p);
        }
    return best;
}

int main(void)
{
    int a[105], n, i, idx;
    int *m;

    scanf("%d", &n);
    for (i = 0; i < n; ++i) scanf("%d", &a[i]);

    m = find_max(a, n, &idx);
    printf("max = %d, index = %d\n", *m, idx);
    return 0;
}
```

:::

## 本章小结

指针的三件正经事：**让函数改到调用者的变量**、**在运行期申请内存**、**用一个变量指向不同的函数**。其余花哨写法都是这三件事的组合。

写指针最常见的三个错误：野指针（没指向就用）、悬空指针（`free` 之后还留着地址）、越界指针（`p + n` 之后还解引用）。它们都不一定当场报错，这也是指针难调的原因。

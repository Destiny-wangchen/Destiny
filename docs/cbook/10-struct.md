---
title: 第 10 章 · 结构体与链表
series: C语言
seriesOrder: 10
---

数组要求所有元素同类型，现实里的"一个东西"往往是混合的：一个学生有学号、姓名、两门成绩，一条订单有编号、金额、时间。结构体就是给这种"打包"用的，链表则是把打包好的结点用指针串起来。

这一章的内容在课程里通常排在指针之后、文件之前，是"从操作数据"过渡到"设计数据结构"的转折点。

必须养成的三个习惯：

- **结构体先定义类型再用**：`typedef struct { ... } Stu;` 之后就能写 `Stu s;`，不用每次都带 `struct`。
- **成员用点、指针用箭头**：`s.math` 和 `p->math` 是同一件事，区别只在 `s` 是结构体还是指针。
- **链表画图再写代码**：画三个方框加两个箭头，把"先接后断"的顺序标出来，比盯着代码猜有效得多。

链表的操作只有四个：**建表**（头插或尾插）、**遍历**、**插入**、**删除**。这四个动作里，最容易错的是指针赋值的顺序：先把新结点的 `next` 接上，再断开原来的链，顺序反了就会丢掉后半段。

本章共 6 道题：2 道精讲例题 + 4 道自选练习。

## 精讲例题

### 例题 1 · 给成绩单排个队

输入 n 个学生的学号、数学、英语成绩，按总分从高到低排序输出；总分相同时学号小的在前。

**输入**：第一行 n（≤ 100），随后 n 行，每行学号、数学、英语。  
**输出**：n 行，每行学号与总分。

**样例**

输入：
```text
3
1 90 80
2 85 95
3 70 100
```
输出：
```text
2 180
1 170
3 170
```

**思路**：把"一个学生的三条信息"装进结构体，排序时整个结构体一起交换，就不会出现"学号换了成绩没换"的事故。

比较函数返回负数表示 `x` 排前面。这里先比总分，降序所以是 `b->sum - a->sum`；总分相同再比学号，升序是 `a->id - b->id`。写反一个符号，排序结果就不对，而且不会报错。

```c
/* 116【应用】结构体 + qsort 多关键字排序 */
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int id;
    int math;
    int eng;
    int sum;
} Stu;

int cmp(const void *x, const void *y)
{
    const Stu *a = (const Stu *)x, *b = (const Stu *)y;
    if (a->sum != b->sum) return b->sum - a->sum;   /* 总分降序 */
    return a->id - b->id;                           /* 同分学号升序 */
}

int main(void)
{
    Stu s[105];
    int n, i;

    scanf("%d", &n);
    for (i = 0; i < n; ++i) {
        scanf("%d%d%d", &s[i].id, &s[i].math, &s[i].eng);
        s[i].sum = s[i].math + s[i].eng;
    }

    qsort(s, n, sizeof(Stu), cmp);

    for (i = 0; i < n; ++i)
        printf("%d %d\n", s[i].id, s[i].sum);
    return 0;
}
```

### 例题 2 · 把链表倒过来

输入 n 个整数，用尾插法建单链表，再把链表就地反转后输出。

**输入**：第一行 n，第二行 n 个整数。  
**输出**：反转后的序列，空格分隔。

**样例**

输入：
```text
5
1 2 3 4 5
```
输出：
```text
5 4 3 2 1
```

**思路**：反转的核心是三个指针：`p` 指向当前结点，`q` 先存住下一个结点，`head` 指向已经反转好的部分。每轮把 `p` 摘下来插到 `head` 前面。

关键是**先存 `p->next` 再改 `p->next`**。顺序反了，`p->next` 一改，下一结点就找不到了，链表当场断成两截。

建表时用 `tail` 这个二级指针，能省掉"第一个结点要单独处理"的分支：`tail` 始终指向"下一个要写入的指针位置"。

```c
/* 117【应用】链表就地反转 */
#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int v;
    struct Node *next;
} Node;

Node *new_node(int v)
{
    Node *p = (Node *)malloc(sizeof(Node));
    p->v = v;
    p->next = NULL;
    return p;
}

int main(void)
{
    int n, i, v;
    Node *head = NULL, **tail = &head, *p, *q;

    scanf("%d", &n);
    for (i = 0; i < n; ++i) {
        scanf("%d", &v);
        *tail = new_node(v);
        tail = &((*tail)->next);
    }

    p = head;
    head = NULL;
    while (p != NULL) {
        q = p->next;      /* 先存下一结点 */
        p->next = head;   /* 再改指向 */
        head = p;
        p = q;
    }

    for (p = head; p != NULL; p = p->next)
        printf("%d%c", p->v, p->next == NULL ? '\n' : ' ');

    while (head != NULL) { q = head->next; free(head); head = q; }
    return 0;
}
```

## 自选练习

::: details 练习 1 · 合并两个有序链表（题面与样例）

输入两个升序序列，各建一条单链表，合并成一条仍然升序的链表后输出。

**输入**：第一行 n 和 n 个整数；第二行 m 和 m 个整数。  
**输出**：合并后的序列，空格分隔。

**样例**

输入：
```text
3
1 4 9
4
2 3 10 11
```
输出：
```text
1 2 3 4 9 10 11
```

合并时两条链各拿一个指针，谁小就接谁，接完往后走一步；某条走空之后，把另一条剩下的整段接上。这里用带头结点的写法，省掉"结果链第一个结点"的判断。

:::

::: details 练习 1 · 参考代码

```c
/* 118【应用】两条有序链表合并 */
#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int v;
    struct Node *next;
} Node;

Node *push(Node *tail, int v)
{
    Node *p = (Node *)malloc(sizeof(Node));
    p->v = v;
    p->next = NULL;
    tail->next = p;
    return p;
}

int main(void)
{
    int n, m, i, v;
    Node ha, hb, hc, *a, *b, *c;

    scanf("%d", &n);
    ha.next = NULL; a = &ha;
    for (i = 0; i < n; ++i) { scanf("%d", &v); a = push(a, v); }

    scanf("%d", &m);
    hb.next = NULL; b = &hb;
    for (i = 0; i < m; ++i) { scanf("%d", &v); b = push(b, v); }

    hc.next = NULL; c = &hc;
    a = ha.next; b = hb.next;
    while (a != NULL && b != NULL) {
        if (a->v <= b->v) { c = push(c, a->v); a = a->next; }
        else              { c = push(c, b->v); b = b->next; }
    }
    while (a != NULL) { c = push(c, a->v); a = a->next; }
    while (b != NULL) { c = push(c, b->v); b = b->next; }

    for (c = hc.next; c != NULL; c = c->next)
        printf("%d%c", c->v, c->next == NULL ? '\n' : ' ');
    return 0;
}
```

:::

::: details 练习 2 · 我的机器是大端还是小端（题面与样例）

不输入任何东西，输出你的机器是 `little` 还是 `big`，并在第二行输出整数 1 在内存里最低地址那个字节的值。

**输入**：无。  
**输出**：两行，第一行 `little` 或 `big`，第二行形如 `最低地址字节 = 1`。

**样例**

输出：
```text
little
最低地址字节 = 1
```

用 `union` 让 `int` 和 `char[4]` 共享同一块内存：给 `i` 赋值 1，再看 `c[0]`。`c[0]` 是 1 说明低位字节放在低地址，就是小端。x86 和大部分 ARM 都是小端。

:::

::: details 练习 2 · 参考代码

```c
/* 119【应用】用 union 判断字节序 */
#include <stdio.h>

int main(void)
{
    union {
        unsigned int i;
        unsigned char c[4];
    } u;

    u.i = 1;
    if (u.c[0] == 1) printf("little\n");
    else printf("big\n");
    printf("最低地址字节 = %u\n", (unsigned)u.c[0]);
    return 0;
}
```

:::

::: details 练习 3 · 只出现一次的数（题面与样例）

输入 n 个整数，除一个数只出现一次外，其余都恰好出现两次。找出那个数。要求 O(n) 时间、O(1) 额外空间。

**输入**：第一行 n（奇数），第二行 n 个整数。  
**输出**：只出现一次的那个数。

**样例**

输入：
```text
7
5 3 5 7 3 9 7
```
输出：
```text
9
```

异或的两个性质：`x ^ x = 0`，`x ^ 0 = x`。全部异或一遍，成对的自己抵消，剩下的就是答案。空间 O(1)，比开计数数组更省。

:::

::: details 练习 3 · 参考代码

```c
/* 120【应用】异或找出唯一出现的数 */
#include <stdio.h>

int main(void)
{
    int n, i, v, ans = 0;
    scanf("%d", &n);
    for (i = 0; i < n; ++i) {
        scanf("%d", &v);
        ans ^= v;
    }
    printf("%d\n", ans);
    return 0;
}
```

:::

::: details 练习 4 · 删掉链表里所有的 x（题面与样例）

输入 n 个整数建单链表，再输入 x，删除链表中所有值等于 x 的结点，输出剩余序列；全部删完输出 `empty`。

**输入**：第一行 n，第二行 n 个整数，第三行 x。  
**输出**：剩余序列或 `empty`。

**样例**

输入：
```text
6
3 1 3 4 3 5
3
```
输出：
```text
1 4 5
```

删除要处理两种位置：删的是头结点（要改 `head`），删的是中间结点（改前一个的 `next`）。用 `prev` 记录前驱，删头结点时 `prev` 还是空，单独处理。

**注意别在 `free` 之后还用 `p`**：先把 `p = p->next` 存好，再 `free` 掉要删的结点。

:::

::: details 练习 4 · 参考代码

```c
/* 121【应用】链表删除指定值的所有结点 */
#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int v;
    struct Node *next;
} Node;

int main(void)
{
    int n, i, v, x;
    Node *head = NULL, **tail = &head, *p, *prev;

    scanf("%d", &n);
    for (i = 0; i < n; ++i) {
        scanf("%d", &v);
        p = (Node *)malloc(sizeof(Node));
        p->v = v;
        p->next = NULL;
        *tail = p;
        tail = &p->next;
    }
    scanf("%d", &x);

    prev = NULL;
    p = head;
    while (p != NULL) {
        if (p->v == x) {
            Node *dead = p;
            p = p->next;
            if (prev == NULL) head = p;
            else prev->next = p;
            free(dead);
        } else {
            prev = p;
            p = p->next;
        }
    }

    if (head == NULL) { printf("empty\n"); return 0; }
    for (p = head; p != NULL; p = p->next)
        printf("%d%c", p->v, p->next == NULL ? '\n' : ' ');
    return 0;
}
```

:::

## 本章小结

结构体解决"多种类型打包"，链表解决"长度不定、频繁插入删除"。两者组合起来就是课程设计里最常见的"学生管理系统"：结构体存记录，链表串起来，增删改查各写一个函数。

链表写完之后一定要释放内存。虽然程序退出时系统会回收，但 `malloc` 和 `free` 成对出现是习惯，也是后面学内存泄漏检测的基础。

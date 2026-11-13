---
title: 第 7 章 · 字符串
series: C语言
seriesOrder: 7
---

C 的字符串没有专门的类型，就是一个以 `\0` 结尾的字符数组。所有字符串技巧都围绕三件事展开：**遍历**、**定位**、**拼接**。

先把最常用的几个库函数记牢：`strlen` 求长度（不含 `\0`），`strcmp` 按字典序比较（返回负/零/正），`strcpy`/`strcat` 复制与拼接，`strchr` 查找字符。自己写遍历时，`for (i = 0; s[i]; ++i)` 比 strlen 更常用——`s[i]` 为 `\0` 时循环自然结束。

字符分类是高频操作：`c >= '0' && c <= '9'` 判数字、`isalpha`/`isdigit`/`toupper`（ctype.h）是现成工具。位运算判字符（如 Base64 的 6-bit 分组）是进阶玩法：把 3 个字节拼成 24 位，再按 6 位一组查表输出。

```c
while (a[i] && b[j])
    out[k++] = (a[i] <= b[j]) ? a[i++] : b[j++];   /* 归并：双指针 */
while (a[i]) out[k++] = a[i++];
while (b[j]) out[k++] = b[j++];
```

这段归并是本章的魂：两个有序串合成一个有序串、单词接龙找重合部分、去重保序，全都是「双指针各管一个串，谁小谁走」的变体。

本章共 11 道题：2 道精讲例题 + 9 道自选练习。

## 精讲例题

### 例题 1 · 归并两个有序串

输入两个已按升序排好的字符串（第二行可能为空），把它们合并成一个仍然升序的字符串。要求每个串只扫一遍，不许先拼接再排序。

**输入**：两行字符串。  
**输出**：合并后的字符串一行。

**样例**

输入：
```text
abcdef
bcefghi
```
输出：
```text
abbccdeeffghi
```

**样例**

输入：
```text
123456
789
```
输出：
```text
123456789
```

**思路**：两个已升序的字符串归并成一个有序串，用双指针各扫一遍：每次取较小者并前进。谁先扫完，把剩下的整体接上。单遍 O(n+m)，比「先拼接再排序」优雅得多。

输入用 fgets 而不是 scanf，才能处理第二个串为空的情况（只敲了回车）。

```c
/* 38【字符】合并字符串：两个升序串归并为一个升序串（各扫一遍） */
#include <stdio.h>
#include <string.h>

int main(void)
{
    char s1[512] = {0}, s2[512] = {0};
    char out[1024];
    int i = 0, j = 0, k = 0;

    if (!fgets(s1, sizeof(s1), stdin)) return 0;
    if (!fgets(s2, sizeof(s2), stdin)) s2[0] = '\0';
    s1[strcspn(s1, "\r\n")] = '\0';
    s2[strcspn(s2, "\r\n")] = '\0';

    while (s1[i] && s2[j])
        out[k++] = (s1[i] <= s2[j]) ? s1[i++] : s2[j++];
    while (s1[i]) out[k++] = s1[i++];
    while (s2[j]) out[k++] = s2[j++];
    out[k] = '\0';

    printf("%s\n", out);
    return 0;
}
```

### 例题 2 · 高精度加减法

实现最多 500 位的十进制正整数加法和减法。输入若干行，每行形如 `a+b` 或 `a-b`；减法结果可能是负数（如 `1-54321` → `-54320`），0 要正常输出，不出现 `-0` 或多余前导零。

**输入**：第一行组数 n，随后每行一个表达式。  
**输出**：每行一个结果。

**样例**

输入：
```text
2
213914+23466123
32862934-23481243
```
输出：
```text
23680037
9381691
```

**样例**

输入：
```text
3
483291674192731231+1236187236812735123
123129678463287562378-28935687264871236
999999999+1
```
输出：
```text
1719478911005466354
123100742776022691142
1000000000
```

**思路**：高精度加减法把数字当成字符串存，按位对齐、逐位运算、维护进位/借位。减法先比较大小决定符号，永远用大减小，最后按需补负号。

写高精度的口诀：低位对齐（下标从末尾往前）、进位用 carry 变量、结果前导零要清理、0 的特判别忘（0-0 还是 0，不能输出 -0）。

```c
/* H16【大学】高精度加减法：支持 500 位十进制整数的加、减运算 */
#include <stdio.h>
#include <string.h>

/* 去掉前导 0，返回有效数字长度 */
static int trim(const char *s, char *out)
{
    int len = (int)strlen(s), i = 0, k = 0;

    while (i < len - 1 && s[i] == '0') ++i;
    while (i < len) out[k++] = s[i++];
    out[k] = '\0';
    return k;
}

/* 比较两个无符号数字串的大小 */
static int cmp_mag(const char *a, const char *b)
{
    int la = (int)strlen(a), lb = (int)strlen(b), i;

    if (la != lb) return la > lb ? 1 : -1;
    for (i = 0; i < la; ++i)
        if (a[i] != b[i]) return a[i] > b[i] ? 1 : -1;
    return 0;
}

/* 无符号加法，结果写入 out（不含符号） */
static void add_mag(const char *a, const char *b, char *out)
{
    int la = (int)strlen(a), lb = (int)strlen(b);
    int i = la - 1, j = lb - 1, k = 0, carry = 0;
    char tmp[1024];

    while (i >= 0 || j >= 0 || carry) {
        int s = carry;
        if (i >= 0) s += a[i--] - '0';
        if (j >= 0) s += b[j--] - '0';
        tmp[k++] = (char)('0' + s % 10);
        carry = s / 10;
    }
    while (k > 1 && tmp[k - 1] == '0') --k;
    for (i = 0; i < k; ++i) out[i] = tmp[k - 1 - i];
    out[k] = '\0';
}

/* 无符号减法 a-b（保证 a>=b） */
static void sub_mag(const char *a, const char *b, char *out)
{
    int la = (int)strlen(a), lb = (int)strlen(b);
    int i = la - 1, j = lb - 1, k = 0, borrow = 0;
    char tmp[1024];

    while (i >= 0) {
        int s = (a[i--] - '0') - borrow;
        if (j >= 0) s -= b[j--] - '0';
        if (s < 0) { s += 10; borrow = 1; }
        else borrow = 0;
        tmp[k++] = (char)('0' + s);
    }
    while (k > 1 && tmp[k - 1] == '0') --k;
    for (i = 0; i < k; ++i) out[i] = tmp[k - 1 - i];
    out[k] = '\0';
}

int main(void)
{
    int n, t;
    char line[2048];

    if (scanf("%d", &n) != 1) return 0;
    for (t = 0; t < n; ++t) {
        char rawa[1024], rawb[1024], a[1024], b[1024], res[2048];
        char op;
        int pos;

        if (scanf("%2047s", line) != 1) return 0;
        pos = -1;
        for (int i = 1; line[i]; ++i)
            if (line[i] == '+' || line[i] == '-') { pos = i; break; }
        if (pos < 0) continue;
        op = line[pos];
        memcpy(rawa, line, (size_t)pos);
        rawa[pos] = '\0';
        strcpy(rawb, line + pos + 1);
        trim(rawa, a);
        trim(rawb, b);

        if (op == '+') {
            add_mag(a, b, res);
        } else {
            int c = cmp_mag(a, b);
            if (c == 0) {
                strcpy(res, "0");
            } else if (c > 0) {
                sub_mag(a, b, res);
            } else {
                char mag[1024];
                sub_mag(b, a, mag);
                snprintf(res, sizeof(res), "-%s", mag);
            }
        }
        printf("%s\n", res);
    }
    return 0;
}
```

## 自选练习

先自己想、自己写，写完再打开参考代码对一对。每题都是「题面」与「代码」两个折叠块。

::: details 练习 1 · 自选车牌合规吗（题面与样例）
自选 5 位车牌尾号有规矩：最后一位必须是数字，其余 4 位中至少有两位是大写字母，且字母 I 和 O 不可用。给定 5 个字符，判断是否合规，输出 `ok.` 或 `no.`。

**输入**：一行 5 个字符。  
**输出**：`ok.` 或 `no.`

**样例**

输入：
```text
AB999
```
输出：
```text
ok.
```

**样例**

输入：
```text
C9D99
```
输出：
```text
ok.
```

:::

::: details 练习 1 · 自选车牌合规吗（参考代码）
```c
/* 39【字符】自编车号：后 5 位，末位必须是数字，其余四位至少两位大写字母(I、O 不可用) */
#include <stdio.h>

int main(void)
{
    char s[64];
    int len, i, letters = 0, ok = 1;

    if (scanf("%63s", s) != 1) return 0;
    len = 0;
    while (s[len]) ++len;
    if (len != 5) ok = 0;

    if (ok && (s[4] < '0' || s[4] > '9')) ok = 0;

    for (i = 0; ok && i < 4; ++i) {
        if (s[i] >= '0' && s[i] <= '9') continue;
        if (s[i] >= 'A' && s[i] <= 'Z' && s[i] != 'I' && s[i] != 'O') {
            ++letters;
            continue;
        }
        ok = 0;                 /* 小写字母、I、O 或其它字符均不合法 */
    }
    if (ok && letters < 2) ok = 0;

    printf("%s\n", ok ? "ok." : "no.");
    return 0;
}
```
:::

::: details 练习 2 · 身份证号校验与升级（题面与样例）
18 位身份证号 = 17 位数字本体 + 1 位校验码。校验码算法：17 位分别乘权重 7 9 10 5 8 4 2 1 6 3 7 9 10 5 8 4 2 求和，对 11 取余，按余数查表 1 0 X 9 8 7 6 5 4 3 2。输入若干号码：15 位的按规则补世纪号（末三位顺序码为 996～999 视为 18 世纪出生）升级成 18 位并补算校验码；18 位的校验合法输出 `Valid`，否则 `Invalid`。

**输入**：第一行个数 n，随后每行一个号码。  
**输出**：逐行输出升级后的号码或校验结论。

**样例**

输入：
```text
4
350622197904130331
11010519491231002X
110105491231002
110105491231996
```
输出：
```text
Invalid
Valid
11010519491231002X
110105184912319965
```

:::

::: details 练习 2 · 身份证号校验与升级（参考代码）
```c
/* 40【日期】身份证的奥秘：15 位升级为 18 位，18 位校验合法性 */
#include <stdio.h>
#include <string.h>

static const int W[17] = {7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2};
static const char CODE[12] = "10X98765432";

/* 由前 17 位数字算出校验码 */
static char check_digit(const char *id17)
{
    int i, sum = 0;

    for (i = 0; i < 17; ++i)
        sum += (id17[i] - '0') * W[i];
    return CODE[sum % 11];
}

static int all_digits(const char *s, int n)
{
    int i;

    for (i = 0; i < n; ++i)
        if (s[i] < '0' || s[i] > '9') return 0;
    return 1;
}

int main(void)
{
    int n, t;

    if (scanf("%d", &n) != 1) return 0;
    for (t = 0; t < n; ++t) {
        char id[32], out[32];
        int len;

        if (scanf("%31s", id) != 1) return 0;
        len = (int)strlen(id);

        if (len == 15) {
            /* 15 位升级：补世纪号后重新计算校验码 */
            const char *xxx = id + 12;                 /* 末三位：xx + p */
            int century18 = (strcmp(xxx, "996") == 0 || strcmp(xxx, "997") == 0 ||
                             strcmp(xxx, "998") == 0 || strcmp(xxx, "999") == 0);
            if (!all_digits(id, 15)) { printf("Invalid\n"); continue; }
            snprintf(out, sizeof(out), "%.6s%s%.9s", id, century18 ? "18" : "19", id + 6);
            out[17] = check_digit(out);
            out[18] = '\0';
            printf("%s\n", out);
        } else if (len == 18) {
            if (!all_digits(id, 17)) { printf("Invalid\n"); continue; }
            if (check_digit(id) == id[17])
                printf("Valid\n");
            else
                printf("Invalid\n");
        } else {
            printf("Invalid\n");
        }
    }
    return 0;
}
```
:::

::: details 练习 3 · 密码强度计（题面与样例）
密码按字符种类数（数字、大写、小写、其他符号共 4 类）评级：长度不足 6 位，或只含一类字符 → `Not Safe`；恰有两类 → `Medium Safe`；三类及以上 → `Safe`。注意密码里可以有空格，要整行读入。

**输入**：第一行组数 N，随后每行一个密码（≤20 字符，可含空格）。  
**输出**：每行一个评级。

**样例**

输入：
```text
10
abcDEF
ABC
qw
`
ABCDEFGHIJKLMNOPQRST
12345678901234567890
          1aB
1 B
a X   
qwe123%^&ABC
```
输出：
```text
Medium Safe
Not Safe
Not Safe
Not Safe
Not Safe
Not Safe
Safe
Not Safe
Safe
Safe
```

:::

::: details 练习 3 · 密码强度计（参考代码）
```c
/* 41【应用】安全的密码：按长度与字符种类数判断安全性 */
#include <stdio.h>
#include <string.h>

int main(void)
{
    int n, t;
    char line[256];

    if (scanf("%d", &n) != 1) return 0;
    fgets(line, sizeof(line), stdin);      /* 吃掉行尾换行 */
    for (t = 0; t < n; ++t) {
        int kinds = 0, hasDigit = 0, hasUpper = 0, hasLower = 0, hasOther = 0;
        size_t i, len;

        if (!fgets(line, sizeof(line), stdin)) break;
        line[strcspn(line, "\r\n")] = '\0';
        len = strlen(line);

        for (i = 0; i < len; ++i) {
            unsigned char c = (unsigned char)line[i];
            if (c >= '0' && c <= '9') hasDigit = 1;
            else if (c >= 'A' && c <= 'Z') hasUpper = 1;
            else if (c >= 'a' && c <= 'z') hasLower = 1;
            else hasOther = 1;
        }
        kinds = hasDigit + hasUpper + hasLower + hasOther;

        if (len < 6 || kinds == 1)
            printf("Not Safe\n");
        else if (kinds == 2)
            printf("Medium Safe\n");
        else
            printf("Safe\n");
    }
    return 0;
}
```
:::

::: details 练习 4 · 单词从大到小（题面与样例）
输入 5 个单词，按字典序从大到小输出，每个一行。

**输入**：5 行单词。  
**输出**：排序后的 5 行。strcmp + 冒泡/选择即可。

**样例**

输入：
```text
BASIC
C++
Pascal
C
Fortran
```
输出：
```text
Pascal
Fortran
C++
C
BASIC
```

:::

::: details 练习 4 · 单词从大到小（参考代码）
```c
/* 42【字符】单词排序：5 个单词按从大到小（strcmp）输出 */
#include <stdio.h>
#include <string.h>

int main(void)
{
    char w[5][64], tmp[64];
    int i, j;

    for (i = 0; i < 5; ++i)
        if (scanf("%63s", w[i]) != 1) return 0;

    for (i = 0; i < 5; ++i)
        for (j = i + 1; j < 5; ++j)
            if (strcmp(w[i], w[j]) < 0) {
                strcpy(tmp, w[i]);
                strcpy(w[i], w[j]);
                strcpy(w[j], tmp);
            }
    for (i = 0; i < 5; ++i)
        printf("%s\n", w[i]);
    return 0;
}
```
:::

::: details 练习 5 · 实现 Base64（题面与样例）
实现标准 Base64 编码：把输入每 3 个字节（24 bit）重组为 4 个 6 bit 组，每组加前导 00 后按表映射成字符（A-Z、a-z、0-9、+、/）。字节数不是 3 的倍数时末尾补 0，补出来的字符写成 `=`。输入长度不超过 70，仅含 ASCII 字符。

**输入**：一行字符串。  
**输出**：编码结果一行，如 `Hello!!` → `SGVsbG8hIQ==`。

**样例**

输入：
```text
Hello!!
```
输出：
```text
SGVsbG8hIQ==
```

**样例**

输入：
```text
<uFKPX]bg
```
输出：
```text
PHVGS1BYXWJn
```

:::

::: details 练习 5 · 实现 Base64（参考代码）
```c
/* H13【学长出题】Base64 编码：每 3 字节一组，拆成 4 个 6bit 索引查表 */
#include <stdio.h>
#include <string.h>

static const char TABLE[] =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

int main(void)
{
    char s[256];
    int len, i;

    if (!fgets(s, sizeof(s), stdin)) return 0;
    s[strcspn(s, "\r\n")] = '\0';
    len = (int)strlen(s);

    for (i = 0; i < len; i += 3) {
        unsigned int b0 = (unsigned char)s[i];
        unsigned int b1 = (i + 1 < len) ? (unsigned char)s[i + 1] : 0;
        unsigned int b2 = (i + 2 < len) ? (unsigned char)s[i + 2] : 0;
        unsigned int v = (b0 << 16) | (b1 << 8) | b2;
        int last = (len - i < 3) ? len - i : 3;   /* 本组实际字节数 */

        putchar(TABLE[(v >> 18) & 0x3F]);
        putchar(TABLE[(v >> 12) & 0x3F]);
        putchar(last >= 2 ? TABLE[(v >> 6) & 0x3F] : '=');
        putchar(last >= 3 ? TABLE[v & 0x3F] : '=');
    }
    putchar('\n');
    return 0;
}
```
:::

::: details 练习 6 · 只留第一次见面（题面与样例）
输入一个字符串（≤100 字符），删除所有重复出现的字符——每个字符只保留第一次出现的位置，其余删掉，相对顺序不变。

**输入**：一行字符串。  
**输出**：去重后的字符串，如 `abacaeedabcdcd` → `abced`。

提示：256 大小的 seen 数组打标记，一次遍历完成。

**样例**

输入：
```text
abacaeedabcdcd
```
输出：
```text
abced
```

**样例**

输入：
```text
111122233344455577yuyuyu
```
输出：
```text
123457yu
```

:::

::: details 练习 6 · 只留第一次见面（参考代码）
```c
/* 37【字符】删除重复字符：保留每个字符首次出现的位置 */
#include <stdio.h>
#include <string.h>

int main(void)
{
    char s[256];
    int seen[256] = {0};
    int i, k = 0;

    if (!fgets(s, sizeof(s), stdin)) return 0;
    s[strcspn(s, "\r\n")] = '\0';

    for (i = 0; s[i]; ++i) {
        unsigned char c = (unsigned char)s[i];
        if (seen[c]) continue;
        seen[c] = 1;
        s[k++] = (char)c;
    }
    s[k] = '\0';
    printf("%s\n", s);
    return 0;
}
```
:::

::: details 练习 7 · 单词接龙找重合（题面与样例）
接龙规则：下一个单词的开头若干字母要和上一个单词的结尾若干字母相同。给定两个单词，找出前一个单词的**后缀**与后一个单词的**前缀**的最长公共部分并输出。

**输入**：两行，各一个单词。  
**输出**：重合部分一行，如 happy / pythen → `py`。

**样例**

输入：
```text
happy
pythen
```
输出：
```text
py
```

**样例**

输入：
```text
sun
unknown
```
输出：
```text
un
```

:::

::: details 练习 7 · 单词接龙找重合（参考代码）
```c
/* 43【字符】单词接龙：求前一个单词的后缀与后一个单词前缀的最长重合部分 */
#include <stdio.h>
#include <string.h>

int main(void)
{
    char a[512], b[512];
    int la, lb, k, best = 0;

    if (scanf("%511s %511s", a, b) != 2) return 0;
    la = (int)strlen(a);
    lb = (int)strlen(b);

    for (k = 1; k <= la && k <= lb; ++k) {
        if (strncmp(a + la - k, b, (size_t)k) == 0)
            best = k;                 /* 从小到大试，最后留下的就是最长重合 */
    }
    if (best > 0) {
        char out[512];
        memcpy(out, b, (size_t)best);
        out[best] = '\0';
        printf("%s\n", out);
    } else {
        printf("\n");
    }
    return 0;
}
```
:::

::: details 练习 8 · 拱猪计分器（题面与样例）
四人拱猪，计分牌共 16 张：猪 S12（-100）、羊 D11（+100）、加倍 C10、红心 H1～H13（分值 -50, -2, -3, …, -40）。规则：红心分散在多家时按上表计分；13 张红心被一家全收，红心合计按 +200 计算；该家若同时持有 S12 和 D11 则总共 +500；持 C10 者若只有这一张计 +50，否则自己其余牌的分值翻倍；一家独揽全部 16 张计 +1000，其余 0 分。给定四家持牌，输出各家得分（正数带 + 号，0 不带符号）。

**输入**：多组数据，每组 4 行，每行先是持牌数再是各张牌；四家持牌数全为 0 表示结束。  
**输出**：每组一行 4 个得分，空格分隔。

**样例**

输入：
```text
4 S12 H3 H5 H13
3 D11 H8 H9
6 C10 H1 H2 H4 H6 H7
3 H10 H11 H12
13 H1 H2 H3 H4 H5 H6 H7 H8 H9 H10 H11 H12 H13
2 S12 C10
1 D11
0
0
0
0
0
```
输出：
```text
-148 +83 -138 -60
+200 -200 +100 0
```

:::

::: details 练习 8 · 拱猪计分器（参考代码）
```c
/* H15【游戏】拱猪计分：按 16 张计分牌的归属计算四家得分 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static const int HEART_VAL[14] = {0, -50, -2, -3, -4, -5, -6, -7,
                                  -8, -9, -10, -20, -30, -40};

/* 判断一张牌的牌面并按位记录 */
int main(void)
{
    while (1) {
        int cnt[4], total = 0;
        int hasS12[4] = {0}, hasD11[4] = {0}, hasC10[4] = {0};
        int heartOwner = -1, heartsInOne = 1;
        int score[4] = {0, 0, 0, 0};
        int i, j, allZero = 1;

        /* 读四家的牌 */
        char cards[4][20][8];
        for (i = 0; i < 4; ++i) {
            if (scanf("%d", &cnt[i]) != 1) return 0;
            if (cnt[i] != 0) allZero = 0;
            for (j = 0; j < cnt[i]; ++j)
                if (scanf("%7s", cards[i][j]) != 1) return 0;
        }
        if (allZero) break;

        /* 统计每家的计分牌情况 */
        int heartCnt[4] = {0};
        int otherCnt[4] = {0};
        for (i = 0; i < 4; ++i) {
            for (j = 0; j < cnt[i]; ++j) {
                char *c = cards[i][j];
                int num = atoi(c + 1);
                ++total;
                if (c[0] == 'H' && num >= 1 && num <= 13) {
                    ++heartCnt[i];
                    if (heartOwner < 0) heartOwner = i;
                    else if (heartOwner != i) heartsInOne = 0;
                } else if (c[0] == 'S' && num == 12) {
                    hasS12[i] = 1;
                } else if (c[0] == 'D' && num == 11) {
                    hasD11[i] = 1;
                } else if (c[0] == 'C' && num == 10) {
                    hasC10[i] = 1;
                } else {
                    heartCnt[i] += 0;
                }
            }
        }

        int whoAll = -1;
        for (i = 0; i < 4; ++i)
            if (cnt[i] == 16) whoAll = i;

        if (whoAll >= 0) {
            /* 一家独揽全部 16 张计分牌 */
            score[whoAll] = 1000;
        } else {
            for (i = 0; i < 4; ++i) {
                int base = 0;
                int hasOther = 0;

                if (heartsInOne && heartCnt[i] == 13) {
                    /* 红心一家全收 */
                    base = 200;
                    if (hasS12[i] && hasD11[i]) base = 500;
                    else {
                        if (hasS12[i]) base -= 100;
                        if (hasD11[i]) base += 100;
                    }
                } else {
                    for (j = 0; j < cnt[i]; ++j) {
                        char *c = cards[i][j];
                        int num = atoi(c + 1);
                        if (c[0] == 'H' && num >= 1 && num <= 13) base += HEART_VAL[num];
                    }
                    if (hasS12[i]) base -= 100;
                    if (hasD11[i]) base += 100;
                }

                hasOther = (cnt[i] - hasS12[i] - hasD11[i] - hasC10[i]) > 0 ||
                           hasS12[i] || hasD11[i];

                if (hasC10[i]) {
                    if (!hasOther) score[i] = 50;      /* 只有 C10 */
                    else score[i] = base * 2;          /* 其它计分牌加倍 */
                } else {
                    score[i] = base;
                }
            }
        }

        for (i = 0; i < 4; ++i) {
            if (i) putchar(' ');
            if (score[i] > 0) printf("+%d", score[i]);
            else printf("%d", score[i]);
        }
        putchar('\n');
    }
    return 0;
}
```
:::

::: details 练习 9 · 高精度小数乘法（题面与样例）
给定两个小数（绝对值 < 10000，小数位最多 50 位，可带负号），精确输出乘积——不能用 double，要按字符串做竖式乘法，再按两数小数位之和定位小数点，最后去掉多余的末尾零与高位的零。

**输入**：两行，各一个小数。  
**输出**：乘积一行，如 `0.3 × 0.3` → `0.09`，`0.2 × 5` → `1`，`-10 × 10` → `-100`。

**样例**

输入：
```text
1.2
1.2
```
输出：
```text
1.44
```

**样例**

输入：
```text
0.3
0.3
```
输出：
```text
0.09
```

:::

::: details 练习 9 · 高精度小数乘法（参考代码）
```c
/* H17【小学】小数相乘：高精度小数乘法（最多 50 位小数，支持负号） */
#include <stdio.h>
#include <string.h>

int main(void)
{
    char sa[256], sb[256], da[128], db[128];
    int na[128], nb[128], res[260];
    int la, lb, i, j, frac, sign = 1, start, end;

    if (scanf("%255s %255s", sa, sb) != 2) return 0;

    /* 拆分符号、整数部分、小数部分 */
    const char *pa = sa, *pb = sb;
    char ia[128], ib[128];
    int fa = 0, fb = 0;

    if (*pa == '-') { sign = -sign; ++pa; }
    if (*pb == '-') { sign = -sign; ++pb; }

    {
        const char *dot = strchr(pa, '.');
        if (dot) {
            int ilen = (int)(dot - pa);
            memcpy(ia, pa, (size_t)ilen); ia[ilen] = '\0';
            strcpy(da, dot + 1);
            fa = (int)strlen(da);
        } else {
            strcpy(ia, pa);
            da[0] = '\0';
        }
        dot = strchr(pb, '.');
        if (dot) {
            int ilen = (int)(dot - pb);
            memcpy(ib, pb, (size_t)ilen); ib[ilen] = '\0';
            strcpy(db, dot + 1);
            fb = (int)strlen(db);
        } else {
            strcpy(ib, pb);
            db[0] = '\0';
        }
    }

    /* 拼成整数字符串后转成数字数组（低位在前） */
    {
        char ta[256], tb[256];
        snprintf(ta, sizeof(ta), "%s%s", ia[0] ? ia : "0", da);
        snprintf(tb, sizeof(tb), "%s%s", ib[0] ? ib : "0", db);
        la = (int)strlen(ta);
        lb = (int)strlen(tb);
        for (i = 0; i < la; ++i) na[i] = ta[la - 1 - i] - '0';
        for (i = 0; i < lb; ++i) nb[i] = tb[lb - 1 - i] - '0';
    }

    memset(res, 0, sizeof(res));
    for (i = 0; i < la; ++i)
        for (j = 0; j < lb; ++j)
            res[i + j] += na[i] * nb[j];
    for (i = 0; i < la + lb; ++i) {
        res[i + 1] += res[i] / 10;
        res[i] %= 10;
    }

    frac = fa + fb;
    int total = la + lb;
    while (total > 1 && res[total - 1] == 0) --total;   /* 去掉高位 0 */

    /* 生成结果字符串（低位在前 → 反转） */
    {
        char buf[300];
        int k = 0;
        for (i = total - 1; i >= 0; --i) buf[k++] = (char)('0' + res[i]);
        buf[k] = '\0';

        /* 插入小数点：从右数 frac 位 */
        char out[320];
        int m = 0;
        if (frac >= k) {
            out[m++] = '0';
            out[m++] = '.';
            for (i = 0; i < frac - k; ++i) out[m++] = '0';
            for (i = 0; i < k; ++i) out[m++] = buf[i];
        } else if (frac > 0) {
            for (i = 0; i < k - frac; ++i) out[m++] = buf[i];
            out[m++] = '.';
            for (i = k - frac; i < k; ++i) out[m++] = buf[i];
        } else {
            for (i = 0; i < k; ++i) out[m++] = buf[i];
        }
        out[m] = '\0';

        /* 去掉小数部分末尾的 0 和多余的小数点 */
        if (strchr(out, '.')) {
            end = (int)strlen(out) - 1;
            while (end > 0 && out[end] == '0') --end;
            if (out[end] == '.') --end;
            out[end + 1] = '\0';
        }
        /* 去掉整数部分多余的 0 */
        start = 0;
        while (out[start] == '0' && out[start + 1] && out[start + 1] != '.') ++start;
        if (strcmp(out + start, "-0") == 0) { /* 不会出现，占位 */ }

        if (sign < 0 && strcmp(out + start, "0") != 0)
            printf("-%s\n", out + start);
        else
            printf("%s\n", out + start);
    }
    return 0;
}
```
:::

---
title: 第 3 章 · 循环结构
series: C语言
seriesOrder: 3
---

# 第 3 章 · 循环结构

循环让计算机干它最擅长的事：重复。三种循环各有分工——`for` 适合「知道要来多少轮」，`while` 适合「不知道几轮，只知道结束条件」，`do-while` 适合「至少来一轮」。绝大多数题用 for 和 while 就够了。

循环题的三个关键件：

- **初始化**：累加器 sum=0、计数器 cnt=0 放在循环外，放里面每轮都被清零，是新手第一大 bug。
- **终止条件**：`<=` 还是 `<`，差一迭代（off-by-one）要用样例验算，别凭感觉。
- **更新**：循环变量必须朝终止方向走，否则死循环。

再记三招常用组合技：**多组输入** `while (scanf("%d %d", &a, &b) == 2)` 读到配对失败为止，遇到哨兵值（如 0 0）再 break；**取余循环移位**，字母表循环、循环队列全靠 `% 26` 这类取余；**逐步输出**，像角谷猜想那样在循环体里边算边打印，循环本身就是答案的一部分。

```c
int sum = 0;
for (int i = n; i <= m; ++i) sum += i;
printf("The sum from %d to %d is %d.\n", n, m, sum);
```

遇到「最少多少步才能超过某个阈值」的题（如 1+2+…+m ≥ n 的最小 m），别套公式，直接让累加器一路涨、涨破阈值时记下轮数——这就是 while 循环的典型画像。

本章共 12 道题：2 道精讲例题 + 10 道自选练习。

## 精讲例题

### 例题 1 · 角谷猜想验证器

任取一个正整数：奇数就乘 3 加 1，偶数就除以 2，反复进行，最终总会落到 1（这是尚未被证明的猜想）。给定 n（1 ≤ n ≤ 2×10⁷），打印整个变换过程；若 20 步内仍未到 1 就停下手里的活。

**输入**：一个整数 n。  
**输出**：每步一行，形如 `5*3+1=16`、`16/2=8`。

**样例**

输入：
```text
5
```
输出：
```text
5*3+1=16
16/2=8
8/2=4
4/2=2
2/2=1
```

**样例**

输入：
```text
15
```
输出：
```text
15*3+1=46
46/2=23
23*3+1=70
70/2=35
35*3+1=106
106/2=53
53*3+1=160
160/2=80
80/2=40
40/2=20
20/2=10
10/2=5
5*3+1=16
16/2=8
8/2=4
4/2=2
2/2=1
```

**思路**：按规则变换并打印每一步：奇数走 n*3+1，偶数走 n/2，直到变成 1 或步数达到 20。这题的价值在于示范「循环 + 逐步输出」：循环变量就是当前值，循环体里先打印后更新。

注意步数上限的判定要在打印前做，别多输出一行。

```c
/* 32.【小学】角谷猜想：奇数乘3加1，偶数除以2，输出每一步，最多20步 */
#include <stdio.h>

int main(void)
{
    long long n;
    int step = 0;

    if (scanf("%lld", &n) != 1) return 0;
    while (n != 1 && step < 20) {
        if (n % 2 != 0) {
            printf("%lld*3+1=%lld\n", n, n * 3 + 1);
            n = n * 3 + 1;
        } else {
            printf("%lld/2=%lld\n", n, n / 2);
            n /= 2;
        }
        ++step;
    }
    return 0;
}
```

### 例题 2 · 数字不许重样的偶数

有些四位偶数的四个数字互不相同，比如 3012。给定若干组范围 [min, max]（0 0 结束输入），每组列出范围内所有这样的数（每个数后跟两个空格），再输出一行 `counter=个数`；若范围不是合法的四位数区间，输出 `Error`。

**输入**：多组，每行两个整数；`0 0` 结束。  
**输出**：每组先输出所有满足条件的数（两个空格分隔，行尾也有两个空格），下一行输出 `counter=N`；非法范围输出一行 `Error`。

**样例**

输入：
```text
3000  3020
6040  6090
0 0
```
输出：
```text
3012  3014  3016  3018  
counter=4
6042  6048  6052  6054  6058  6072  6074  6078  6082  6084  
counter=10
```

**样例**

输入：
```text
9  101
87 -1
0 0
```
输出：
```text
Error
Error
```

**思路**：外层枚举区间里每个四位偶数，内层把 n 拆成四个数字检查两两不同（也可用「数字出现标记数组」）。多组输入直到 0 0，范围不合法要输出 Error。

这是标准的「循环套循环 + 多组数据」模板，输出细节（数字之间两个空格、行尾计数）要拿样例对齐。

```c
/* 34.【中学·循环】寻找特殊偶数：四位偶数且各位数字两两不同 */
#include <stdio.h>

/* 判断四位数 n 的各位是否两两不同 */
static int distinct_digits(int n)
{
    int d[4], i, j;

    d[0] = n / 1000;
    d[1] = n / 100 % 10;
    d[2] = n / 10 % 10;
    d[3] = n % 10;
    for (i = 0; i < 4; ++i)
        for (j = i + 1; j < 4; ++j)
            if (d[i] == d[j]) return 0;
    return 1;
}

int main(void)
{
    int lo, hi, n, counter;

    while (scanf("%d %d", &lo, &hi) == 2) {
        if (lo == 0 || hi == 0) break;
        if (lo < 1000 || hi > 9999 || lo > hi) {
            printf("Error\n");
            continue;
        }
        counter = 0;
        for (n = lo; n <= hi; ++n) {
            if (n % 2 != 0) continue;
            if (!distinct_digits(n)) continue;
            printf("%d  ", n);
            ++counter;
        }
        printf("\ncounter=%d\n", counter);
    }
    return 0;
}
```

## 自选练习

先自己想、自己写，写完再打开参考代码对一对。每题都是「题面」与「代码」两个折叠块。

::: details 练习 1 · 只往正方向走（题面与样例）
从三维坐标原点出发，每次沿 x、y 或 z 的正方向走一个单位，走到 (x, y, z)（x, y, z 为小于 10 的正整数）。问共有多少条不同路线。

本质是排列组合（x+y+z 步里选 x 步走 x 方向……），但只用一个 for 循环逐步乘除也能算。注意结果增长很快，要换 `long long` 或 `double` 按需选择。

**输入**：一行三个整数 x y z。  
**输出**：路线总数，如 (1,1,1) 为 6，(3,3,3) 为 1680。

**样例**

输入：
```text
1 1 1
```
输出：
```text
6
```

**样例**

输入：
```text
1 2 1
```
输出：
```text
12
```

:::

::: details 练习 1 · 只往正方向走（参考代码）
```c
/* 35.【循环】程序猿的烦恼：三维网格从原点到 (x,y,z) 的路径数 = (x+y+z)!/(x!y!z!) */
#include <stdio.h>

/* 组合数 C(n,k)，边乘边除保证整除 */
static unsigned long long comb(int n, int k)
{
    unsigned long long r = 1;
    int i;

    if (k > n - k) k = n - k;
    for (i = 1; i <= k; ++i)
        r = r * (n - k + i) / i;
    return r;
}

int main(void)
{
    int x, y, z;
    unsigned long long ways;

    if (scanf("%d %d %d", &x, &y, &z) != 3) return 0;
    ways = comb(x + y, x);
    ways *= comb(x + y + z, z);
    printf("%llu\n", ways);
    return 0;
}
```
:::

::: details 练习 2 · 调和级数求和（题面与样例）
计算 SUM = 1 + 1/2 + 1/3 + … + 1/n，保留 6 位小数输出。

**输入**：整数 n。  
**输出**：一行，形如 `sum=1.833333`。

提示：1/i 是整数除法得 0，必须写成 1.0/i。这是 int 与 double 混合运算的经典陷阱。

**样例**

输入：
```text
1
```
输出：
```text
sum=1.000000
```

**样例**

输入：
```text
2
```
输出：
```text
sum=1.500000
```

:::

::: details 练习 2 · 调和级数求和（参考代码）
```c
/* 33.【小学·循环】计算SUM的值：SUM = 1 + 1/2 + ... + 1/n */
#include <stdio.h>

int main(void)
{
    int n, i;
    double sum = 0.0;

    if (scanf("%d", &n) != 1) return 0;
    for (i = 1; i <= n; ++i)
        sum += 1.0 / i;
    printf("sum=%lf\n", sum);
    return 0;
}
```
:::

::: details 练习 3 · 自恋的数字（题面与样例）
一个 n 位正整数，如果它等于自己每一位数字的 n 次方之和，就叫特殊数（如 407 = 4³ + 0³ + 7³）。给定位数 n（n ≤ 6），从小到大输出所有 n 位特殊数；一个都没有时输出 `No output.`

**输入**：整数 n。  
**输出**：每个特殊数一行，或一行 `No output.`

提示：先算好每位数字的 n 次方表（0～9），再枚举区间，否则幂次计算会拖慢速度。

**样例**

输入：
```text
3
```
输出：
```text
153
370
371
407
```

**样例**

输入：
```text
2
```
输出：
```text
No output.
```

:::

::: details 练习 3 · 自恋的数字（参考代码）
```c
/* 36.【中学·循环】寻找阿姆斯特朗数：n 位数等于各位数字 n 次方之和 */
#include <stdio.h>

int main(void)
{
    int n, i, cnt = 0;
    long long lo = 1, hi = 1, v;
    int d[8];

    if (scanf("%d", &n) != 1) return 0;
    for (i = 0; i < n; ++i) {
        lo *= 10;
        hi *= 10;
    }
    lo /= 10;

    for (v = lo; v < hi; ++v) {
        long long t = v, sum = 0;
        int k;
        for (k = 0; k < n; ++k) {
            d[k] = (int)(t % 10);
            t /= 10;
        }
        for (k = 0; k < n; ++k) {
            long long p = 1;
            int j;
            for (j = 0; j < n; ++j) p *= d[k];
            sum += p;
        }
        if (sum == v) {
            printf("%lld\n", v);
            ++cnt;
        }
    }
    if (cnt == 0) printf("No output.\n");
    return 0;
}
```
:::

::: details 练习 4 · 加法复读机（题面与样例）
输入两个整数 n 和 m（n ≤ m），输出 n 到 m 的累加和。

**输入**：两个整数。  
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

::: details 练习 4 · 加法复读机（参考代码）
```c
#include <stdio.h>
int main(){
	int a,b,c;
	int d=0;
	scanf("%d %d",&a,&b);
	for(c=a;c<=b;c++) d=d+c;
	printf("The sum from %d to %d is %d.\n",a,b,d);
	return 0;	
}
```
:::

::: details 练习 5 · 加到刚刚好（题面与样例）
求满足 1 + 2 + … + m ≥ n 的最小 m。例如 n = 100 时，加到 13 只有 91，加到 14 是 105，答案是 14。

**输入**：一个整数 n。  
**输出**：最小的 m。

**样例**

输入：
```text
100
```
输出：
```text
14
```

:::

::: details 练习 5 · 加到刚刚好（参考代码）
```c
/* 26.【数列】求最小 m 值：1+2+...+m >= n 的最小 m */
#include <stdio.h>

int main(void)
{
    int n, sum = 0, m = 0;

    if (scanf("%d", &n) != 1) return 0;
    while (sum < n) {
        ++m;
        sum += m;
    }
    printf("%d\n", m);
    return 0;
}
```
:::

::: details 练习 6 · 字母接龙（题面与样例）
输入一个起始字母（大小写均可），从这个字母开始按字母表顺序输出 26 个字母，越过 Z（或 z）后回到 A（或 a）继续。

**输入**：一个字母。  
**输出**：连续 26 个字母一行，如输入 D 输出 `DEFGHIJKLMNOPQRSTUVWXYZABC`。

**样例**

输入：
```text
D
```
输出：
```text
DEFGHIJKLMNOPQRSTUVWXYZABC
```

**样例**

输入：
```text
f
```
输出：
```text
fghijklmnopqrstuvwxyzabcde
```

:::

::: details 练习 6 · 字母接龙（参考代码）
```c
#include <stdio.h>

int main() {
    char c;
    int i;
   c = getchar(); 
    
    for (i = 0; i < 26; i++) {
       printf("%c", c);
        c = c + 1;
       if (c > 'Z' && c < 'a') {
             c = c - 26; 
        } else if (c > 'z') {
            c = c - 26;
        }
    }
    
    printf("\n"); 
    return 0;
}
```
:::

::: details 练习 7 · 最大公约数（题面与样例）
输入两个正整数，输出它们的最大公约数。辗转相除（gcd(a, b) = gcd(b, a % b)）或枚举约数都行。

**输入**：两个整数 x y。  
**输出**：一行，形如 `GCD(32,12)=4`（输入顺序不影响结果）。

**样例**

输入：
```text
32 12
```
输出：
```text
GCD(32,12)=4
```

**样例**

输入：
```text
12 32
```
输出：
```text
GCD(12,32)=4
```

:::

::: details 练习 7 · 最大公约数（参考代码）
```c
#include <stdio.h>

int main() {
    int x, y, a, b, temp;
    
    scanf("%d %d", &x, &y);
    
    a = x;
    b = y;
    
    while (b != 0) {
        temp = a % b;
        a = b;
        b = temp;
    }
    
    printf("GCD(%d,%d)=%d\n", x, y, a);
    
    return 0;
}
```
:::

::: details 练习 8 · 手算除法（题面与样例）
模仿竖式除法：给定分数 a/b（1 ≤ a < b < 200），输出其小数形式，小数点后最多 200 位。每一步把余数乘 10 除以 b 得到下一位；余数为 0 时除尽，提前结束，不要用 0 补位。

**输入**：一行，形如 `16/19`。  
**输出**：一行，形如 `0.842105...`（最多 200 位小数）。

**样例**

输入：
```text
1/8
```
输出：
```text
0.125
```

**样例**

输入：
```text
16/19
```
输出：
```text
0.84210526315789473684210526315789473684210526315789473684210526315789473684210526315789473684210526315789473684210526315789473684210526315789473684210526315789473684210526315789473684210526315789473684
```

:::

::: details 练习 8 · 手算除法（参考代码）
```c
#include <stdio.h>

int main() {
    int a, b;
    
    // 必须按题目要求使用 / 作为分隔符
    scanf("%d/%d", &a, &b);
    
    printf("0.");
    
    int remainder = a % b;
    
    // 最多输出200位
    for (int i = 0; i < 200; i++) {
        // 除尽则提前结束
        if (remainder == 0) {
            break;
        }
        
        remainder *= 10;
        printf("%d", remainder / b);
        remainder %= b;
    }
    
    printf("\n");
    
    return 0;
}
```
:::

::: details 练习 9 · 分数加法（题面与样例）
输入四个整数 fz1 fm1 fz2 fm2，代表两个分数 fz1/fm1 与 fz2/fm2（-100 ≤ 分子 ≤ 100，0 < 分母 ≤ 100），求和并约分后输出最简分数。

**输入**：一行 4 个整数。  
**输出**：形如 `1/2`；结果为负时输出 `-1/6`；结果为 0 时输出 `0/1`（按你的实现对齐样例即可）。

**样例**

输入：
```text
1 3 1 6
```
输出：
```text
1/2
```

**样例**

输入：
```text
0 1 2 3
```
输出：
```text
2/3
```

:::

::: details 练习 9 · 分数加法（参考代码）
```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    int fz1, fm1, fz2, fm2;
    scanf("%d %d %d %d", &fz1, &fm1, &fz2, &fm2);
    
    int x = fz1 * fm2 + fz2 * fm1;
    int y = fm1 * fm2;
    
    if (x == 0) {
        printf("0/1\n");
        return 0;
    }
    
    int tx = abs(x);
    int ty = abs(y);
    while (ty != 0) {
        int t = tx % ty;
        tx = ty;
        ty = t;
    }
    
    x /= tx;
    y /= tx;
    
    if (y < 0) {
        x = -x;
        y = -y;
    }
    
    printf("%d/%d\n", x, y);
    
    return 0;
}
```
:::

::: details 练习 10 · 最像它的分数（题面与样例）
给定正整数 x, y, n，在所有分母不超过 n 的分数里找出与 x/y 最接近的一个。并列时取分母最小的，再并列取分子最小的。

**输入**：一行三个整数 x y n（1 ≤ x, y, n ≤ 10⁵）。  
**输出**：形如 `2/5`。逐个分母枚举、用乘法比较 |x·b - a·y| 可以完全避开浮点误差。

**样例**

输入：
```text
3 7 6
```
输出：
```text
2/5
```

**样例**

输入：
```text
7 2 4
```
输出：
```text
7/2
```

:::

::: details 练习 10 · 最像它的分数（参考代码）
```c
#include <stdio.h>
#include <math.h>

int main() {
    long long x, y, n;
    scanf("%lld %lld %lld", &x, &y, &n);
    
    long long best_a = 0, best_b = 1;
    double min_diff = 1e18; 
    
    for (long long b = 1; b <= n; b++) {
        long long a = (x * b) / y;
        
        for (long long k = 0; k <= 1; k++) {
            long long cur_a = a + k;
            if (cur_a < 0) continue;
            
            double diff = fabs((double)x / y - (double)cur_a / b);
            
            if (diff < min_diff) {
                min_diff = diff;
                best_a = cur_a;
                best_b = b;
            } else if (fabs(diff - min_diff) < 1e-12) {
                if (b < best_b) {
                    best_a = cur_a;
                    best_b = b;
                } else if (b == best_b && cur_a < best_a) {
                    best_a = cur_a;
                    best_b = b;
                }
            }
        }
    }
    
    printf("%lld/%lld\n", best_a, best_b);
    
    return 0;
}
```
:::

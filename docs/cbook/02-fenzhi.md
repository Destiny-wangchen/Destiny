---
title: 第 2 章 · 分支结构
series: C语言
seriesOrder: 2
---

# 第 2 章 · 分支结构

程序开始「看情况办事」，就是分支结构。C 里有三件武器：`if / else if / else` 处理区间和复杂条件，`switch` 处理离散的选项，三目运算符 `a ? b : c` 处理二选一。

三个高频踩坑点，先记下来：

- `==` 是比较，`=` 是赋值。`if (a = 5)` 永远为真，还顺手改了 a 的值。
- 区间判断要写全：`0 <= x && x <= 9`，写成 `0 <= x <= 9` 在 C 里恒为真。
- 浮点数不要用 `==` 判相等，判别式 Δ 为零要写成 `fabs(d) < 1e-9` 这种形式。

分支题的真正功夫在**分支树的顺序**。像判断三角形：先判「不构成三角形」（两边之和大于第三边），再判等边，再判等腰，最后才是一般三角形——漏了任何一层，测试用例立刻教做人。写之前先在纸上把所有情况列全，再决定谁先谁后。

```c
if (a + b > c && b + c > a && c + a > b) {   /* 先筛掉不成形的 */
    if (a == b && b == c)      printf("equilateral triangle.\n");
    else if (a == b || b == c || c == a) printf("isoceles triangle.\n");
    else                        printf("triangle.\n");
}
else printf("non-triangle.\n");
```

还有一类分支题考的是**查表思维**：把每种情况对应的文案写进数组或 switch，程序主体就只剩「定位 + 取值」。信号报告、英文数字读法都是这个套路的经典练习。

本章共 11 道题：2 道精讲例题 + 9 道自选练习。

## 精讲例题

### 例题 1 · 三角形体检

输入三条边长（正整数），判断三角形形状：等边、等腰、一般三角形，或者根本构不成三角形。

**输入**：三个整数。  
**输出**（四选一）：`equilateral triangle.` / `isoceles triangle.` / `triangle.` / `non-triangle.`

**样例**

输入：
```text
2 2 2
```
输出：
```text
equilateral triangle.
```

**样例**

输入：
```text
3 2 2
```
输出：
```text
isoceles triangle.
```

**思路**：分支顺序决定成败。先判断能否构成三角形（任意两边之和大于第三边），再由内到外判断等边（三边相等）、等腰（任意两边相等）、一般三角形。只要有一层顺序错了，等边会被先判成等腰。

这题是学习「if 嵌套 + 分类完备」的标准素材：四个输出对应四片互斥区域，写完自己把四条样例走一遍分支树。

```c
#include <stdio.h>

int main() {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);

    if (a + b > c && a + c > b && b + c > a) {
        if (a == b && b == c) {
            printf("equilateral triangle.\n");
        } else if (a == b || a == c || b == c) {
            printf("isoceles triangle.\n");
        } else {
            printf("triangle.\n");
        }
    } else {
        printf("non-triangle.\n");
    }

    return 0;
}
```

### 例题 2 · 电台信号报告

业余电台的信号报告是两位数字：十位表示清晰度（1～5），个位表示强度（1～9）。给定一个两位数，输出对应的完整含义。

清晰度（十位）：1=Unreadable，2=Barely readable, occasional words distinguishable，3=Readable with considerable difficulty，4=Readable with practically no difficulty，5=Perfectly readable。

强度（个位）：1=Faint signals, barely perceptible，2=Very weak signals，3=Weak signals，4=Fair signals，5=Fairly good signals，6=Good signals，7=Moderately strong signals，8=Strong signals，9=Extremely strong signals。

**输入**：一个两位整数（个位不为 0）。  
**输出**：强度文案 + `, ` + 清晰度文案（首字母小写）+ `.`，如 `Weak signals, readable with considerable difficulty.`；当清晰度为 1 时它本身以逗号结尾，样例形如 `Faint signals, barely perceptible, unreadable.`

**样例**

输入：
```text
59
```
输出：
```text
Extremely strong signals, perfectly readable.
```

**样例**

输入：
```text
33
```
输出：
```text
Weak signals, readable with considerable difficulty.
```

**思路**：信号报告是两位数字，十位是清晰度（5 级），个位是强度（9 级）。与其写一大串 if，不如准备两个字符串数组，按下标直接取文案，再拼成一句话。

注意输出细节：强度在前、清晰度在后，清晰度文案首字母要小写，标点全是英文的。查表法能把「一堆分支」压成「两次下标访问」，后面单词排序、身份证校验都会反复用到。

```c
#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);

    int r = n / 10; 
    int s = n % 10; 

    switch (s) {
        case 1: printf("Faint signals, barely perceptible"); break;
        case 2: printf("Very weak signals"); break;
        case 3: printf("Weak signals"); break;
        case 4: printf("Fair signals"); break;
        case 5: printf("Fairly good signals"); break;
        case 6: printf("Good signals"); break;
        case 7: printf("Moderately strong signals"); break;
        case 8: printf("Strong signals"); break;
        case 9: printf("Extremely strong signals"); break;
    }

    printf(", ");

    switch (r) {
        case 1: printf("unreadable"); break;
        case 2: printf("barely readable, occasional words distinguishable"); break;
        case 3: printf("readable with considerable difficulty"); break;
        case 4: printf("readable with practically no difficulty"); break;
        case 5: printf("perfectly readable"); break;
    }

    printf(".\n");

    return 0;
}
```

## 自选练习

先自己想、自己写，写完再打开参考代码对一对。每题都是「题面」与「代码」两个折叠块。

::: details 练习 1 · 闰年判断（题面与样例）
给一个年份（>1900），判断是不是闰年。规则：能被 4 整除但不能被 100 整除，或者能被 400 整除。

**输入**：一个年份。  
**输出**：形如 `2016 is a leap year.` 或 `2013 is not a leap year.`

**样例**

输入：
```text
2013
```
输出：
```text
2013 is not a leap year.
```

**样例**

输入：
```text
2016
```
输出：
```text
2016 is a leap year.
```

:::

::: details 练习 1 · 闰年判断（参考代码）
```c
#include <stdio.h>

int main() 
{
    int Y;
    scanf("%d", &Y);
    
    int is_leap = (Y % 4 == 0 && Y % 100 != 0) || (Y % 400 == 0);
    
    printf(is_leap ? "%d is a leap year.\n" : "%d is not a leap year.\n", Y);
    
    return 0;
}
```
:::

::: details 练习 2 · 那天星期几（题面与样例）
给一个年月日（年份 > 1900），算出它是星期几。输出 0～6，星期日是 0，星期一是 1，以此类推。

**输入**：三个整数：年 月 日。  
**输出**：一个 0～6 的整数。

提示：以 1900 年 1 月 1 日（星期一）为基准，累加天数再对 7 取余；记得闰年多一天，且闰年只影响 3 月之后的日期。

**样例**

输入：
```text
2013 3 11
```
输出：
```text
1
```

**样例**

输入：
```text
2013 3 15
```
输出：
```text
5
```

:::

::: details 练习 2 · 那天星期几（参考代码）
```c
#include <stdio.h>

int main() 
{
    int year, m, d;
    scanf("%d %d %d", &year, &m, &d);
    
    int y = year - (m <= 2);       
    int mm = m + (m <= 2) * 12;    
    
    int w = (d + 2 * mm + 3 * (mm + 1) / 5 + y + y / 4 - y / 100 + y / 400 + 1) % 7;
    
    printf("%d\n", w);
    return 0;
}
```
:::

::: details 练习 3 · 解一元二次方程（题面与样例）
输入系数 a、b、c，解方程 ax² + bx + c = 0。各种特殊情况都要接住：a、b、c 全零或 a、b 全零无解时输出 `Input error!`；a = 0 退化成一次方程；判别式为零时两根相同，按 `x1=x2=...` 输出；其余输出两个根，x1 取较大者。根一律保留 6 位小数。

**输入**：三个整数 a、b、c。  
**输出**：见上，形如 `x1=0.414214`、`x2=-2.414214`。

**样例**

输入：
```text
0 0 0
```
输出：
```text
Input error!
```

**样例**

输入：
```text
0 0 10
```
输出：
```text
Input error!
```

:::

::: details 练习 3 · 解一元二次方程（参考代码）
```c
#include <stdio.h>
#include <math.h>

int main() {
    int a, b, c;
    if (scanf("%d %d %d", &a, &b, &c) != 3) return 0;

    if (a == 0) {
        if (b == 0) {
            printf("Input error!\n");
        } else {
            double x = -(double)c / b;
            printf("x=%.6f\n", x + 0.0); 
        }
    } else {
        double delta = (double)b * b - 4.0 * a * c;
        
        if (delta > 0) {
            double x2 = (-b - sqrt(delta)) / (2.0 * a);
            double x1 = (-b + sqrt(delta)) / (2.0 * a);
            printf("x1=%.6f\n", x1 + 0.0);
            printf("x2=%.6f\n", x2 + 0.0);
        } else if (delta == 0) {
            double x = -b / (2.0 * a);
            printf("x1=x2=%.6f\n", x + 0.0);
        } else {
            printf("No real root\n");
        }
    }

    return 0;
}
```
:::

::: details 练习 4 · 椭圆的切线（题面与样例）
给定椭圆 x²/a² + y²/b² = 1（输入 a² 和 b²，均为正整数）以及椭圆上一点 (x₀, y₀)，输出过该点的切线方程。切线公式：x₀x/a² + y₀y/b² = 1。若给定点根本不在椭圆上，输出 `Input error!`；切线垂直（y₀ = 0）时按 `x=-2.000000` 输出；切线水平（x₀ = 0）时按 `y=1.000000` 输出。系数保留 6 位小数。

**输入**：第一行两个整数（a²、b²），第二行两个整数（定点坐标）。  
**输出**：切线方程，形如 `y=-0.500000x+2.000000`（注意系数为负时符号的衔接）。

**样例**

输入：
```text
4 2
-2 0
```
输出：
```text
x=-2.000000
```

**样例**

输入：
```text
4 2
1 2
```
输出：
```text
Input error!
```

:::

::: details 练习 4 · 椭圆的切线（参考代码）
```c
#include <stdio.h>

int main() {
    long long a2, b2;
    double x0, y0;

    if (scanf("%lld %lld", &a2, &b2) != 2) return 0;
    if (scanf("%lf %lf", &x0, &y0) != 2) return 0;

    if (x0 * x0 * b2 + y0 * y0 * a2 != a2 * b2) {
        printf("Input error!\n");
        return 0;
    }

    if (y0 == 0) {
        printf("x=%.6f\n", (double)a2 / x0 + 0.0);
    } else {
        double k = -(x0 * b2) / (y0 * a2);
        double m = b2 / y0;
        
        k = k + 0.0;
        m = m + 0.0;

        if (x0 == 0) {
            printf("y=%.6f\n", m);
        } else {
            if (m > 0) {
                printf("y=%.6fx+%.6f\n", k, m);
            } else if (m < 0) {
                printf("y=%.6fx%.6f\n", k, m);
            } else {
                printf("y=%.6fx\n", k);
            }
        }
    }

    return 0;
}
```
:::

::: details 练习 5 · 作息时间查询（题面与样例）
先原样打印 10 行作息菜单（菜单文案见样例），再读一个选项编号，用 **switch** 输出对应事项和时间（如 `起床洗漱 6:20`、`上午上课 8:00`），无效选项输出 `选项错误`。

**输入**：一个整数（选项）。  
**输出**：菜单 10 行 + `请输入选项：` + 对应结果一行，全部以样例为准。

**样例**

输入：
```text
1
```
输出：
```text
--小明作息时间表--
  1. 起床洗漱
  2. 锻炼身体
  3. 早餐
  4. 上课
  5. 午餐休息
  6. 上课
  7. 自由活动
  8. 晚餐
  9. 晚自习
 10. 上床休息
请输入选项：
起床洗漱 6:20
```

**样例**

输入：
```text
2
```
输出：
```text
--小明作息时间表--
  1. 起床洗漱
  2. 锻炼身体
  3. 早餐
  4. 上课
  5. 午餐休息
  6. 上课
  7. 自由活动
  8. 晚餐
  9. 晚自习
 10. 上床休息
请输入选项：
锻炼身体 6:30
```

:::

::: details 练习 5 · 作息时间查询（参考代码）
```c
#include <stdio.h>

int main() {
    int choice;
    
    printf("--小明作息时间表--\n");
    printf("  1. 起床洗漱\n");
    printf("  2. 锻炼身体\n");
    printf("  3. 早餐\n");
    printf("  4. 上课\n");
    printf("  5. 午餐休息\n");
    printf("  6. 上课\n");
    printf("  7. 自由活动\n");
    printf("  8. 晚餐\n");
    printf("  9. 晚自习\n");
    printf(" 10. 上床休息\n");
    printf("请输入选项：\n");
    
    scanf("%d", &choice);
    
    switch (choice) {
        case 1:
            printf("起床洗漱 6:20\n");
            break;
        case 2:
            printf("锻炼身体 6:30\n");
            break;
        case 3:
            printf("早餐 7:30\n");
            break;
        case 4:
            printf("上午上课 8:00\n");
            break;
        case 5:
            printf("午餐休息 12:00\n");
            break;
        case 6:
            printf("下午上课 13:20\n");
            break;
        case 7:
            printf("自由活动 16:00\n");
            break;
        case 8:
            printf("晚餐 17:30\n");
            break;
        case 9:
            printf("晚自习 19:30\n");
            break;
        case 10:
            printf("上床休息 23:00\n");
            break;
        default:
            printf("选项错误\n");
            break;
    }
    
    return 0;
}
```
:::

::: details 练习 6 · 会报错的星期计算（题面与样例）
在第 1 章星期计算的基础上加工程校验：输入年月日（年 > 1900），先检查合法性——月份不在 1～12 输出 `month is wrong.`，日期超出该月天数输出 `day is wrong.`，两者都不对输出 `month and day are wrong.`，合法才输出星期（0～6，星期日为 0）。检查闰年、大月小月，别把 2 月忘了。

**输入**：三个整数：年 月 日。  
**输出**：星期几，或对应错误提示。

**样例**

输入：
```text
2013 3 11
```
输出：
```text
1
```

**样例**

输入：
```text
2013 13 15
```
输出：
```text
month is wrong.
```

:::

::: details 练习 6 · 会报错的星期计算（参考代码）
```c
#include <stdio.h>

int main() {
    int year, month, day;
    scanf("%d %d %d", &year, &month, &day);


    if (year <= 1900) {
        printf("year is wrong\n");
        return 0;
    }


    int month_wrong = (month < 1 || month > 12);
    int day_wrong = 0;

    if (!month_wrong) {
        int days_in_month[] = {0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
 
        if ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)) {
            days_in_month[2] = 29;
        }
        if (day < 1 || day > days_in_month[month]) {
            day_wrong = 1;
        }
    } else {
        if (day < 1 || day > 31) {
            day_wrong = 1;
        }
    }

    if (month_wrong && day_wrong) {
        printf("month and day are wrong.\n");
        return 0;
    } else if (month_wrong) {
        printf("month is wrong.\n");
        return 0;
    } else if (day_wrong) {
        printf("day is wrong.\n");  
        return 0;
    }

    int y = year;
    int m = month;
    if (m == 1 || m == 2) {
        m += 12;
        y--;
    }
    int w = (day + 2 * m + 3 * (m + 1) / 5 + y + y / 4 - y / 100 + y / 400 + 1) % 7;
    
    printf("%d\n", w);

    return 0;
}
```
:::

::: details 练习 7 · 数字的英文读法（题面与样例）
输入一个两位数（10～99），输出它的英文读法，首字母大写：11 → `Eleven`，45 → `Forty-five`（十位与个位之间用连字符）。10～19 是一整套特殊单词（Ten、Eleven……Nineteen），整十数后面不接连字符。

**输入**：一个两位整数。  
**输出**：英文读法一行。

**样例**

输入：
```text
11
```
输出：
```text
Eleven
```

**样例**

输入：
```text
45
```
输出：
```text
Forty-five
```

:::

::: details 练习 7 · 数字的英文读法（参考代码）
```c
#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);

    if (n >= 10 && n <= 19) {
        switch (n) {
            case 10: printf("Ten\n"); break;
            case 11: printf("Eleven\n"); break;
            case 12: printf("Twelve\n"); break;
            case 13: printf("Thirteen\n"); break;
            case 14: printf("Fourteen\n"); break;
            case 15: printf("Fifteen\n"); break;
            case 16: printf("Sixteen\n"); break;
            case 17: printf("Seventeen\n"); break;
            case 18: printf("Eighteen\n"); break;
            case 19: printf("Nineteen\n"); break;
        }
        return 0;
    }

    int tens = n / 10;
    int units = n % 10;

    switch (tens) {
        case 2: printf("Twenty"); break;
        case 3: printf("Thirty"); break;
        case 4: printf("Forty"); break;
        case 5: printf("Fifty"); break;
        case 6: printf("Sixty"); break;
        case 7: printf("Seventy"); break;
        case 8: printf("Eighty"); break;
        case 9: printf("Ninety"); break;
    }

    if (units != 0) {
        printf("-");
        switch (units) {
            case 1: printf("one"); break;
            case 2: printf("two"); break;
            case 3: printf("three"); break;
            case 4: printf("four"); break;
            case 5: printf("five"); break;
            case 6: printf("six"); break;
            case 7: printf("seven"); break;
            case 8: printf("eight"); break;
            case 9: printf("nine"); break;
        }
    }
    
    printf("\n");

    return 0;
}
```
:::

::: details 练习 8 · 两部电梯听谁的（题面与样例）
一栋楼有两部电梯，均只在 1～10 层间服务。模型规则：有未完成任务时电梯只在 1 楼和 10 楼之间往返，不在中间楼层掉头；无任务时可在任意层待机、任意方向出发；运行匀速，停靠时间忽略。

输入六个数：左电梯所在层、左电梯状态（0 待机 / 1 上行 / 2 下行）、右电梯所在层、右电梯状态、你所在层、目标层。按「谁先来接你最短时间」原则输出调度结果：`left one`、`right one` 或 `left one or right one`（两人一样快）。判断时注意电梯方向与你目标方向是否顺路。

**输入**：一行 6 个整数。  
**输出**：一行调度结果。

**样例**

输入：
```text
8 2 5 1 6 1
```
输出：
```text
left one
```

**样例**

输入：
```text
7 1 7 1 2 6
```
输出：
```text
left one or right one
```

:::

::: details 练习 8 · 两部电梯听谁的（参考代码）
```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    int a, b, c, d, e, f;
    if (scanf("%d %d %d %d %d %d", &a, &b, &c, &d, &e, &f) != 6) return 0;

    int dist_left = 0, dist_right = 0;

    if (b == 0) {
        dist_left = abs(a - e);
    } else if (b == 1) {
        if (f > e && a < e) {
            dist_left = e - a;
        } else {
            dist_left = (10 - a) + (10 - e);
        }
    } else if (b == 2) {
        if (f < e && a > e) {
            dist_left = a - e;
        } else {
            dist_left = (a - 1) + (e - 1);
        }
    }

    if (d == 0) {
        dist_right = abs(c - e);
    } else if (d == 1) {
        if (f > e && c < e) {
            dist_right = e - c;
        } else {
            dist_right = (10 - c) + (10 - e);
        }
    } else if (d == 2) {
        if (f < e && c > e) {
            dist_right = c - e;
        } else {
            dist_right = (c - 1) + (e - 1);
        }
    }

    if (dist_left < dist_right) {
        printf("left one\n");
    } else if (dist_left > dist_right) {
        printf("right one\n");
    } else {
        printf("left one or right one\n");
    }

    return 0;
}
```
:::

::: details 练习 9 · 神秘的除数（题面与样例）
输入正整数 N 和 M（N ≥ M），问有多少个正整数 K 满足 ⌊N/K⌋ = ⌊N/M⌋（⌊x⌋ 为向下取整）。只输出个数。

N 最大到 2147483647，暴力枚举 K 必然超时。想通「商为 q 时 K 的取值范围是 [⌊N/(q+1)⌋+1, ⌊N/q⌋]」这道题就只剩几行代码。

**输入**：两个整数 N M。  
**输出**：满足条件的 K 的个数。

**样例**

输入：
```text
19 5
```
输出：
```text
2
```

**样例**

输入：
```text
89 13
```
输出：
```text
2
```

:::

::: details 练习 9 · 神秘的除数（参考代码）
```c
#include <stdio.h>

int main() {
    long long N, M;
    if (scanf("%lld %lld", &N, &M) != 2) return 0;

    long long Q = N / M;
    
    long long K_max = N / Q;
    long long K_min_minus_1 = N / (Q + 1);
    
    long long count = K_max - K_min_minus_1;

    printf("%lld\n", count);

    return 0;
}
```
:::

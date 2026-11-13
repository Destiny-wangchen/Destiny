---
title: 第 1 章 · Hello 世界与顺序结构
series: C语言
seriesOrder: 1
---

# 第 1 章 · Hello 世界与顺序结构

程序从上到下一行一行执行，不做任何选择、也不回头，这就是**顺序结构**。它只做三件事：读进来、算出来、写出去。

读进来靠 `scanf`，写出去靠 `printf`。这两个函数真正的难点是**格式控制符**：%d 读整数，%lf 读双精度浮点，%c 读单个字符，%s 读一个单词；输出时 %3d 表示占 3 个字符宽右对齐，%.2f 表示保留两位小数，%02d 表示不足两位补 0。格式和变量类型对不上，是初学阶段最常见的翻车点。

「算出来」这一步要记住两条铁律：

- **整数除法会丢掉小数部分**：5/2 的结果是 2，不是 2.5。想要小数，就把其中一个数写成 2.0，或者先乘成浮点再除。
- **int 有范围上限（约 21 亿）**：乘法动辄溢出，像素计算、大数乘积这类题，老老实实换 `long long`，输出用 %lld。

字符在内存里就是一个整数（ASCII 码）：'A' 是 65，'a' 是 97，'0' 是 48。所以大写转小写就是 +32，判断数字就是拿它和 '0' 比。字符当数字用，是后面所有字符串题的地基。

```c
#include <stdio.h>

int main(void)
{
    int w, h, min;
    scanf("%d*%d %d", &w, &h, &min);   /* 读 1024*768 1 这种带字符的输入 */
    printf("%lld\n", (long long)w * h * min * 43200 / 8 / 1024);
    return 0;
}
```

这段代码里有本章的全部要点：scanf 里可以混着写普通字符（`*` 原样匹配输入）、中间计算先转 `long long` 防溢出。顺序结构的题，题面越长越是纸老虎——先把公式在纸上列出来，代码往往只有一两行。

本章共 13 道题：2 道精讲例题 + 11 道自选练习。

## 精讲例题

### 例题 1 · 数字倒放

给一个三位正整数，把它倒过来输出，前导零也要保留：307 变 703，250 变 052，700 变 007。

**输入**：一个三位正整数。  
**输出**：倒序后的三位数（保持三位宽度）。

**样例**

输入：
```text
307
```
输出：
```text
703
```

**样例**

输入：
```text
250
```
输出：
```text
052
```

**思路**：把 n 拆成百位、十位、个位，再按「个十百」重新拼一个数。真正的坑在输出：250 倒过来是 052，直接 %d 会把前导零吞掉，必须用 `%03d` 强制补齐三位。

拆位用整除和取余：个位 n%10，十位 n/10%10，百位 n/100。这三招贯穿后面所有「逐位处理」的题。

```c
#include <stdio.h>

int main() 
{
    int n;
    scanf("%d", &n);          

    int g   = n % 10;        
    int s  = (n / 10) % 10; 
    int b  = n / 100;       
    int result = g * 100 + s * 10 + b;  
    printf("%03d\n", result);  
    return 0;
}
```

### 例题 2 · 钟面上的夹角

输入时刻 h 和 m（0 ≤ h ≤ 12，0 ≤ m ≤ 59），输出时针与分针之间较小夹角，精确到一位小数。夹角范围 [0, 180]。

**输入**：两个整数。  
**输出**：一行，形如 `At 3:03 the angle is 73.5 degrees.`（时间按 h:m 输出，m 两位补零）。

**样例**

输入：
```text
12 0
```
输出：
```text
At 12:00 the angle is 0.0 degrees.
```

**样例**

输入：
```text
12 30
```
输出：
```text
At 12:30 the angle is 165.0 degrees.
```

**思路**：时针每分钟走 0.5°，分针每分钟走 6°。设从 12:00 起 t = 60h+m 分钟，两针夹角就是 |30h - 5.5m| 度。若超过 180°，用 360° 减一下取劣弧。

别小看这道题：把「钟面」翻译成「两个随时间线性增长的角度」，就是数学建模。模型对了，代码只剩一行 `fabs`。

```c
#include <stdio.h>
#include <math.h>

int main() {
    int h, m;
 
    while (scanf("%d %d", &h, &m) != EOF) {
   
        if (h == 0) {
            h = 12;
        }

     
        double minute_angle = m * 6.0;
        double hour_angle = h * 30.0 + m * 0.5;

        double diff = fabs(hour_angle - minute_angle);

        double min_angle = fmin(diff, 360.0 - diff);

        printf("At %d:%02d the angle is %.1f degrees.\n", h, m, min_angle);
    }
    return 0;
}
```

## 自选练习

先自己想、自己写，写完再打开参考代码对一对。每题都是「题面」与「代码」两个折叠块。

::: details 练习 1 · 第一次编译（题面与样例）
学习任何一门语言，传统上都要先让程序说一句话。请照着写一个 C 程序，让它原样输出一行 `Hello world.`（注意句号，注意大小写）。

**输入**：无。  
**输出**：`Hello world.`

**样例**

输入：
```text

```
输出：
```text
Hello world.
```

:::

::: details 练习 1 · 第一次编译（参考代码）
```c
#include <stdio.h>
int main()
{  printf("Hello world.\n");
   return 0;
}
```
:::

::: details 练习 2 · 字符的身份证号（题面与样例）
每个字符在计算机里都存成一个编号（ASCII 码）。读入一个字符，输出它的编号。

**输入**：一个字符。  
**输出**：一行，格式形如 `The ASCII of character 「A」 is 65.`（引号也是输出的一部分，实际输出用英文单引号）。

**样例**

输入：
```text
A
```
输出：
```text
The ASCII of character 'A' is 65.
```

**样例**

输入：
```text
Z
```
输出：
```text
The ASCII of character 'Z' is 90.
```

:::

::: details 练习 2 · 字符的身份证号（参考代码）
```c
#include <stdio.h>
int main()
{  char x;
   scanf("%c",&x);
   printf("The ASCII of character '%c' is %d.\n",x,x);
   return 0;
}
```
:::

::: details 练习 3 · 大小写开关（题面与样例）
输入一个字符：小写字母换成大写，大写字母换成小写，别的字符原样输出。

**输入**：一个字符。  
**输出**：转换后的字符。

**样例**

输入：
```text
A
```
输出：
```text
a
```

**样例**

输入：
```text
Z
```
输出：
```text
z
```

:::

::: details 练习 3 · 大小写开关（参考代码）
```c
#include <stdio.h>

int main() 
{
    char c;
    scanf("%c", &c);

    int is_lower = (c >= 'a' && c <= 'z');  
    int is_upper = (c >= 'A' && c <= 'Z');  
    c = c - 32 * is_lower + 32 * is_upper;

    printf("%c\n", c);
    return 0;
}
```
:::

::: details 练习 4 · 谁大谁小（题面与样例）
输入两个整数，说出它们的关系。注意输出里的大小关系用中文描述，且句末带英文句号。

**输入**：两个整数。  
**输出**：三种之一——`10 小于 20.`、`20 大于 10.`、`两个数相等，均为 20.`（相等时两个数都写出来）。

**样例**

输入：
```text
10 20
```
输出：
```text
10 小于 20.
```

**样例**

输入：
```text
20 10
```
输出：
```text
20 大于 10.
```

:::

::: details 练习 4 · 谁大谁小（参考代码）
```c
#include <stdio.h>

int main() 
{
    int a, b;
    
    scanf("%d%d", &a, &b); 
    
    if (a > b) {
        printf("%d 大于 %d.\n", a, b);
    } else if (a < b) {
        printf("%d 小于 %d.\n", a, b);
    } else {
        printf("两个数相等，均为 %d.\n", a); 
    }
    
    return 0;
}
```
:::

::: details 练习 5 · 过了几个龙年（题面与样例）
今年是龙年。一个 12 岁的孩子说「这是我过的第一个龙年」，爸爸说这是他过的第二个龙年——因为出生那年那次也算。给定一个人的年龄（≥0），算他已经经历过几个龙年。

**输入**：一个非负整数，年龄。  
**输出**：经历过的龙年个数。这题不需要循环，一行公式就够。

**样例**

输入：
```text
12
```
输出：
```text
2
```

**样例**

输入：
```text
14
```
输出：
```text
2
```

:::

::: details 练习 5 · 过了几个龙年（参考代码）
```c
#include <stdio.h>

int main() 
{
    int a,b;
    
    scanf("%d", &a); 
    b=a/12+1;
    printf("%d\n",b);
    return 0;
}
```
:::

::: details 练习 6 · 温度换算（题面与样例）
摄氏和华氏的换算公式是 F = C × 9/5 + 32。输入一个字母和一个数值：字母表示要**转换成**的温标（C 表示要转成摄氏，F 表示要转成华氏），数值是待转换的温度。输出转换结果，保留两位小数。

**输入**：一行，字母 + 空格 + 数值，如 `C 100`。  
**输出**：一行，如 `The Centigrade is 37.78`（C 结尾输出 Centigrade，F 结尾输出 Fahrenheit）。

**样例**

输入：
```text
C 100
```
输出：
```text
The Centigrade is 37.78
```

**样例**

输入：
```text
F  -6.67
```
输出：
```text
The Fahrenheit is 19.99
```

:::

::: details 练习 6 · 温度换算（参考代码）
```c
#include <stdio.h>

int main() 
{
    char type;  
    float temp; 
    float result; 
    scanf("%c %f", &type, &temp);
    if (type == 'C') 
    {
        result = (temp - 32) * 5.0 / 9.0;
		 printf("The Centigrade is %.2f\n", result); 
    } 
    else if (type == 'F') 
    {
        result = temp * 9.0 / 5.0 + 32; 
         printf("The Fahrenheit is %.2f\n", result);
    }

    return 0;
}
```
:::

::: details 练习 7 · 拿苹果的必胜策略（题面与样例）
桌上有一堆 n 个苹果，两人轮流拿，每次拿 1 个或 2 个，拿到最后一个苹果的人赢。你先手。如果双方都足够聪明，你第一次应该拿几个才能必胜？如果怎么拿都赢不了，输出 0。

**输入**：正整数 n（1 ≤ n ≤ 10⁶）。  
**输出**：0、1 或 2。

提示：想想「给对手留下 3 的倍数」意味着什么。

**样例**

输入：
```text
4
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
2
```

:::

::: details 练习 7 · 拿苹果的必胜策略（参考代码）
```c
#include <stdio.h>
int main(){
	int a,b;
	scanf("%d",&a);
	b=a%3;
	printf("%d\n",b);
	return 0;
}
```
:::

::: details 练习 8 · 母亲节是哪天（题面与样例）
母亲节是每年五月的第二个星期日。给定年份（>1900），算出那一年的母亲节是 5 月几号。全程不需要循环和复杂的 if，关键是推公式：先算 5 月 1 日是星期几，再推第二个星期日。

**输入**：一个年份。  
**输出**：一行，形如 `2014年的母亲节是5月11日。`

**样例**

输入：
```text
2014
```
输出：
```text
2014年的母亲节是5月11日。
```

**样例**

输入：
```text
2015
```
输出：
```text
2015年的母亲节是5月10日。
```

:::

::: details 练习 8 · 母亲节是哪天（参考代码）
```c
#include <stdio.h>

int main() 
{
    int Y;
    scanf("%d", &Y);

    int w = (14 + Y + Y/4 - Y/100 + Y/400) % 7;
    int day = 14 - w;

    printf("%d年的母亲节是5月%d日。\n", Y, day);
    
    return 0;
}
```
:::

::: details 练习 9 · 一部电影有多大（题面与样例）
未压缩的视频非常占空间。设画面宽 W 高 H（像素），每秒 30 帧，每帧每像素用 24 位色彩。给定画面尺寸和片长（分钟），估算文件占多少 KB（1 KB = 1024 B，1 B = 8 bit）。

**输入**：一行，形如 `1024*768 1`——先尺寸（高*宽），后片长（分钟）。  
**输出**：占用的 KB 数（整数）。注意中间结果很大，要用 `long long`。

**样例**

输入：
```text
1024*768 1
```
输出：
```text
4147200
```

**样例**

输入：
```text
800*600 3
```
输出：
```text
7593750
```

:::

::: details 练习 9 · 一部电影有多大（参考代码）
```c
#include <stdio.h>

int main() {
    long long h, w, m; 
    scanf("%lld*%lld %lld", &h, &w, &m); 
    long long total_kb = (h * w * 3 * 30 * m * 60) / 1024;
    printf("%lld\n", total_kb);
    
    return 0;
}
```
:::

::: details 练习 10 · 把秒拆开（题面与样例）
一天有 86400 秒。输入一个秒数 n（0 ≤ n ≤ 10⁹），把它拆成天、小时、分钟、秒。

**输入**：一个非负整数。  
**输出**：一行，形如 `0天1小时21分20秒`，要求 0 ≤ h < 24，0 ≤ m, s < 60。

**样例**

输入：
```text
4880
```
输出：
```text
0天1小时21分20秒
```

:::

::: details 练习 10 · 把秒拆开（参考代码）
```c
#include <stdio.h>

int main(){
	int a,b,c,d,e;
	scanf("%d",&a);
	b=a/86400;
	c=a%86400/3600;
	d=a%86400%3600/60;
	e=a%86400%3600%60;
	printf("%d天%d小时%d分%d秒\n",b,c,d,e);
	return 0;
}
```
:::

::: details 练习 11 · 数一数二进制里的 1（题面与样例）
输入一个 int 范围内的整数，统计它的二进制表示里有多少个 1。注意负数：int 用补码存储，-1 的二进制是 32 个 1。

**输入**：一个整数。  
**输出**：二进制中 1 的个数。

提示：把数强转成 `unsigned` 再逐位看，负数的坑就绕过去了。

**样例**

输入：
```text
1024
```
输出：
```text
1
```

**样例**

输入：
```text
512
```
输出：
```text
1
```

:::

::: details 练习 11 · 数一数二进制里的 1（参考代码）
```c
#include <stdio.h>

int main() {
    int a;
    scanf("%d", &a);

    unsigned int u = (unsigned int)a;
    int count = 0;

    while (u > 0) {
        if (u % 2 == 1) {   
            count++;
        }
        u = u / 2;    
    }

    printf("%d\n", count);
    return 0;
}
```
:::

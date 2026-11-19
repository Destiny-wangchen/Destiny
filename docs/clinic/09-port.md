---
title: 病例 09 · 端口被占用到底占了什么
series: C语言门诊
seriesOrder: 9
description: 第二次 bind 同一个端口会返回 10048，服务重启后经常"地址已被占用"。端口只有 16 位，被占的是 IP 加端口这个组合，还要算上 TIME_WAIT。
---

## 主诉

写了个最简单的服务器，跑起来正常，关掉，改两行代码重新跑，报错：

```text
bind failed: 10048
```

`10048` 是 Windows 的 `WSAEADDRINUSE`，Linux 上是 `EADDRINUSE`，报错文案都一样：Address already in use。

更奇怪的是，有时候等半分钟再跑就好了，有时候怎么等都好不了。有人干脆每次改端口，8080 换 8081 换 8082，一个项目占了十个端口。

## 化验

```c
#include <stdio.h>
#include <winsock2.h>

int main(void)
{
    WSADATA wsa;
    SOCKET s1, s2;
    struct sockaddr_in addr;

    WSAStartup(MAKEWORD(2, 2), &wsa);

    s1 = socket(AF_INET, SOCK_STREAM, 0);
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    addr.sin_port = htons(8080);

    printf("第一次 bind: %d\n", bind(s1, (struct sockaddr *)&addr, sizeof(addr)));
    printf("listen:     %d\n", listen(s1, SOMAXCONN));

    s2 = socket(AF_INET, SOCK_STREAM, 0);
    printf("第二次 bind: %d\n", bind(s2, (struct sockaddr *)&addr, sizeof(addr)));
    printf("错误码:     %d\n", WSAGetLastError());

    closesocket(s2);
    closesocket(s1);
    WSACleanup();
    return 0;
}
```

实测：

```text
第一次 bind: 0
listen:     0
第二次 bind: -1
错误码:     10048
```

同一个进程，两个 socket，绑同一个 IP 和端口，第二个失败。

## 诊断：被占的不是"端口号"，是"IP + 端口"

端口是 16 位数，范围 0～65535。但操作系统记录的不是一个孤零零的数字，而是**IP 地址加端口**这个组合。所以 `127.0.0.1:8080` 和 `192.168.1.5:8080` 可以同时被监听，互不冲突。

`bind` 的语义是"这块地址归我了"，所以同一个 `IP:端口` 只能有一个监听者。第二个 socket 来要同一块地，内核拒绝，返回 `EADDRINUSE`。

这也解释了两个容易搞混的端口段：

- 0～1023 是特权端口，普通用户绑不上（80、443 都在这里，所以要用 root 或者反向代理）；
- 1024～49151 是注册端口，自己写服务一般从这里挑；
- 49152 以上是临时端口，客户端 `connect` 时由系统分配。

## 为什么"等一会儿就好了"

TCP 连接关闭时，主动关的那一方会进入 `TIME_WAIT` 状态，持续 2MSL（Windows 上大约 2 分钟，Linux 60 秒）。这期间那个 `IP:端口` 还被内核占着，防止旧连接的延迟报文混进新连接。

所以服务重启失败有两种情况：

**一是旧进程还在。** 你可能只是关了窗口，进程没退，端口还握着。这种等多久都没用，得杀进程。

**二是旧连接在 `TIME_WAIT`。** 这种等一两分钟自己就好。开发期反复重启，几乎每次都撞上这个。

## 三个排查动作

**看谁占着。** Windows 上 `netstat -ano | findstr :8080`，最后一列是 PID，再到任务管理器里对；Linux 上 `lsof -i :8080` 或 `ss -tlnp`。这一条能解决九成的"端口被占用"。

**让端口可以复用。** 服务端在 `bind` 之前设置 `SO_REUSEADDR`，允许在 `TIME_WAIT` 期间重新绑定：

```c
int on = 1;
setsockopt(s1, SOL_SOCKET, SO_REUSEADDR, (const char *)&on, sizeof(on));
```

这一行几乎是所有服务器框架的标配，写 socket 作业时加上，能省掉大量"重启失败"。

**让系统挑端口。** 客户端不需要固定端口，`bind` 时把端口设成 0，内核会分配一个空闲的临时端口。服务端也可以这么干，然后用 `getsockname` 把实际端口读出来，测试用例里特别方便。

## 处方

1. 端口号从配置或命令行读，别硬编码。硬编码的直接后果就是撞端口，而且撞了以后改代码重新编译。
2. 服务端 `bind` 前加 `SO_REUSEADDR`，除非你明确需要"端口被占就报错"。
3. 报错时打印 `WSAGetLastError()`（Windows）或 `errno`（Linux）。光打印"绑定失败"，等于什么都没说。
4. 别用特权端口做开发，8080、8000、3000 这些随便挑一个，但记得在文档里写清楚。
5. 排查先看 `netstat`，再看进程，最后才怀疑代码。顺序反了会浪费很多时间。

## 复诊

端口这件事在书上通常只有一页，但它是网络编程里第一个真正会拦住你的东西。等你看完下一篇的三次握手，再回头看 `TIME_WAIT`，会发现它和握手、挥手是同一套状态机的一部分。

下一篇讲**连接被拒绝和超时不是一回事**。同一个 `connect` 调用，错误码不同，说明网络上发生的事完全不同。

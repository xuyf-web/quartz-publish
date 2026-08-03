---
title: "VS Code 连接服务器及使用注意事项"
description: "介绍 VS Code Remote-SSH 的配置、免密登录、远端组件管理和常见连接故障排查。"
date: 2026-06-26
collection: "科研工作流与工具链"
permalink: /vscode-remote-ssh-guide
tags:
  - VSCode
  - SSH
  - 远程开发
  - 服务器
---
VS Code 连服务器这件事，刚开始看起来只是装个 Remote-SSH 插件，填一下 IP 和用户名。真用久了才会发现，很多问题并不出在 VS Code 本身，而是出在服务器网络、home 空间、`.bashrc`、SSH key 和远程服务端缓存这些地方。

我自己遇到过比较典型的情况：普通终端能登录，Xshell 也能登录，但 VS Code Remote-SSH 就一直卡在初始化。最后发现不是服务器坏了，也不是插件坏了，而是 shell 启动脚本里有一行命令让 VS Code 的远程启动流程解析失败。

所以这篇不只写“怎么连”，也把连接服务器时比较容易踩的坑一起整理一下。

> [!warning]
> 文中所有服务器名、路径和端口都是示例，实际使用时换成自己的配置。

# 1. 先说适合什么场景

如果只是偶尔上服务器看一眼文件，终端加 `vim` 也能解决。但如果经常要改脚本、看日志、调 Python 环境、改 WRF/CMAQ 配置文件，VS Code Remote-SSH 会省很多事。

它比较适合这些场景：

- 本地编辑服务器上的代码；
- 远程终端里直接运行脚本；
- 一边看日志，一边改配置；
- 用 Git 管理服务器上的项目；
- 在 Cursor、Trae 这类 VS Code 系编辑器里使用远程项目。

要注意的是，Remote-SSH 不是单纯“打开一个 SSH 窗口”。它会在服务器上装一个 VS Code Server。也就是说，服务器端的网络、磁盘空间和 shell 初始化脚本，都会影响连接是否成功。

# 2. 安装 Remote-SSH

在 VS Code 插件市场里搜索：

```txt
Remote - SSH
```

安装后，可以按 `F1`，输入：

```txt
Remote-SSH: Connect to Host...
```

然后选择服务器。

如果还没有配置服务器，建议先把 SSH 信息写到本地的 `~/.ssh/config` 里。这样 VS Code、终端、scp、rsync 都可以共用同一套配置。

# 3. 写 SSH config

一个最基础的配置长这样：

```sshconfig
Host lab-server
    HostName your.server.ip
    User your_username
    Port 22
```

这里的 `lab-server` 是本地别名，可以自己起。以后命令行里直接：

```bash
ssh lab-server
```

如果命令行能连上，VS Code 大概率也能识别这个配置。

我比较建议先在普通终端里把 SSH 调通，再去 VS Code 里连接。这样出问题时能少排查一层：如果终端都连不上，就先别怀疑 VS Code。

# 4. 配置免密登录

VS Code 可以输入密码连接，但每次都输密码很烦。更推荐配 SSH key。

本地生成密钥：

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

如果服务器比较老，不支持 `ed25519`，再用：

```bash
ssh-keygen -t rsa -b 4096
```

把公钥传到服务器：

```bash
ssh-copy-id lab-server
```

没有 `ssh-copy-id` 的话，就手动把本地公钥内容追加到服务器的：

```bash
~/.ssh/authorized_keys
```

服务器上 `.ssh` 相关权限也要对：

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

最后重新测试：

```bash
ssh lab-server
```

不再要求输入密码，就说明免密登录配置好了。

# 5. 不要忽略 `.vscode-server`

第一次连接服务器时，VS Code 会在远程账户下安装服务端程序，常见目录是：

```bash
~/.vscode-server
```

如果用 Cursor，可能是：

```bash
~/.cursor-server
```

这个目录里放着 VS Code Server、远程插件和一些缓存。问题在于：VS Code 每次版本更新后，远程端可能会多出一个新版本目录，旧版本不会自动清掉。

很多服务器的 home 空间又很小。时间一长，`.vscode-server` 占几个 GB 并不奇怪。home 一旦满了，就会出现各种看起来没关系的问题：连不上、环境异常、程序写不了缓存、conda 也报错。

所以我建议一开始就把 VS Code Server 放到空间更大的数据盘。

在本地 VS Code 设置里搜索：

```txt
Remote.SSH: Server Install Path
```

给对应服务器指定一个路径，例如：

```txt
/data/your_username/.vscode-server
```

这个路径按自己的服务器情况改，不要照抄。

如果已经堆了很多旧缓存，也可以删除后重连：

```bash
rm -rf ~/.vscode-server
```

正常情况下，删的是 VS Code 的远程服务端，不是你的项目代码。重连时它会重新安装。

> [!warning]
> 运行 `rm -rf` 前一定确认路径，不要在项目目录或数据目录里误删。

# 6. 连接失败时怎么排查

## 一直卡在初始化

如果右下角一直显示类似：

```txt
Setting up SSH Host Server
Initializing VS Code Server
```

我会按这个顺序查：

1. 普通终端 `ssh lab-server` 能不能登录；
2. home 目录是不是满了；
3. `~/.vscode-server` 是否安装到一半；
4. 服务器能不能下载 VS Code Server；
5. `~/.bashrc` 或 `~/.zshrc` 有没有奇怪的自动命令。

第 5 点很容易被忽略。VS Code Remote-SSH 连接时会执行一套远程启动脚本，如果 shell 初始化文件里自动输出了很多内容，或者启动了交互程序，甚至包含某些特殊字符，都可能让 VS Code 判断失败。

普通终端能登录，不代表 VS Code 一定能登录。因为它们走的不是完全一样的启动流程。

## 只有某台电脑连不上

这种情况可以先别急着改服务器。既然其他电脑能连，服务器整体大概率没问题。

可以检查：

- 本地 VS Code 版本；
- Remote-SSH 插件版本；
- 本地 `~/.ssh/config`；
- VS Code Remote-SSH 缓存；
- `ssh -v lab-server` 的详细输出。

有时候更新 VS Code 后，远程端需要重新安装对应版本的 server。也有可能本地缓存出了问题。

## 只有某个账号连不上

如果同一台服务器其他账号能连，自己的账号不行，就重点看账号环境：

- home 是否超额；
- `.vscode-server` 是否损坏；
- `.ssh` 权限是否正确；
- `.bashrc`、`.zshrc` 是否最近改过；
- 默认 shell 是否会输出额外内容。

我自己那次问题，最后就是 `.bashrc` 里某个工具自动加了一行命令，终端能正常用，但 VS Code Remote-SSH 解析不了。注释掉之后就恢复了。

# 7. 我的建议配置

如果是长期要用的服务器，我会这样处理：

1. 本地 `~/.ssh/config` 里写清楚别名；
2. 配好 SSH key，尽量不要每次输密码；
3. VS Code Server 不放 home，改到数据盘；
4. 定期清理旧的 `.vscode-server`；
5. `.bashrc` 里少写会自动输出或自动启动的东西；
6. 出问题先用普通终端测试 SSH，再看 VS Code。

# 总结

VS Code 连接服务器好用，但它依赖的不只是 SSH。真正影响稳定性的，往往是这些细节：

- 服务器能不能下载远程服务端；
- home 空间够不够；
- `.vscode-server` 有没有损坏；
- shell 启动脚本是否干净；
- 本地 SSH 配置是否统一。

把这些处理好之后，远程改代码、看日志、跑脚本都会顺很多。尤其是长期在服务器上做模型和数据处理的人，值得花一点时间把 Remote-SSH 配好。

## 相关阅读

- [[vscode-ssh|VS Code使用SSH]]
- [[ssh-x11-forwarding|Windows 和 macOS SSH X11 图形转发配置教程]]
- [[tmux-server-workbench|tmux：把一个终端变成服务器工作台]]

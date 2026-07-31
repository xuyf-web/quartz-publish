---
title: "Windows 和 macOS SSH X11 图形转发配置教程"
description: "讲解 Windows 与 macOS 通过 SSH X11 转发运行服务器图形程序的配置和排错方法。"
date: 2026-06-25
collection: "科研工作流与工具链"
permalink: /ssh-x11-forwarding
tags:
  - SSH
  - X11
  - 远程开发
  - 服务器
---
有些服务器软件虽然主要在命令行里运行，但偶尔还是需要图形界面，例如查看 NetCDF、打开可视化工具、测试某些 GUI 程序等。

如果本地是 Windows 11 或 macOS，可以通过 SSH X11 转发，把 Linux 服务器上的图形界面显示到自己的电脑桌面。

> [!summary]
> 本文适合的场景：Windows 11 Terminal / macOS Terminal / iTerm2 + OpenSSH + Linux 服务器。
>
> 基本思路：本地先启动 X Server，SSH 负责把远程 GUI 程序的显示请求转发回来。

# 1. X11 转发的基本原理

X11 的设计支持图形界面通过网络传输。远程服务器运行 GUI 程序，本地电脑负责显示窗口。

```txt
Linux 服务器（运行 GUI 程序）
        ↓ SSH 加密隧道
Windows / macOS 本地（X Server 接收并显示）
```

Windows 和 macOS 默认都不是完整的 X11 桌面环境，所以需要额外准备一个本地 X Server：

| 本地系统 | 推荐 X Server |
|---|---|
| Windows 11 | VcXsrv |
| macOS | XQuartz |

# 2. Windows 11 端配置

## 安装 VcXsrv

推荐通过 winget 安装：

```powershell
winget install marha.VcXsrv
```

也可以从 SourceForge 手动下载安装。

## 启动 XLaunch

在开始菜单中搜索 `XLaunch`，按以下方式设置：

| 步骤 | 选项 | 说明 |
|---|---|---|
| Display settings | Multiple Windows | 每个远程 GUI 程序独立窗口显示 |
| Client startup | Start no client | 只启动 X Server，等待远程程序连接 |
| Extra settings | Disable access control | 避免图形连接被拒绝 |

完成后，任务栏右下角会出现 VcXsrv 图标，说明 X Server 已运行。

> [!warning]
> VcXsrv 不会在每次重启后自动启动。重启电脑后，需要重新打开 XLaunch。也可以把 `.xlaunch` 配置文件放入 Windows 启动目录。

## 设置 DISPLAY 环境变量

在 PowerShell 中写入：

```powershell
Add-Content $PROFILE "`n`$env:DISPLAY = 'localhost:0'"
```

重新打开 Terminal，或立即执行：

```powershell
. $PROFILE
```

检查：

```powershell
echo $env:DISPLAY
```

正常应输出：

```txt
localhost:0
```

如果同时安装了 Xmanager，VcXsrv 有可能不是 `:0`，而是 `:1`。这时需要把 PowerShell 里的 `DISPLAY` 改成对应编号，例如：

```powershell
$env:DISPLAY = 'localhost:1'
```

# 3. macOS 端配置

## 安装 XQuartz

如果已经安装了 Homebrew，可以直接：

```bash
brew install --cask xquartz
```

也可以从 XQuartz 官网下载 `.pkg` 安装包。

安装完成后，建议注销并重新登录一次 macOS，或者至少完全退出并重新打开 Terminal / iTerm2。这样 shell 才能拿到 XQuartz 设置的环境变量。

## 启动 XQuartz

可以在 Launchpad 中打开 `XQuartz`，也可以在终端执行：

```bash
open -a XQuartz
```

启动后检查本地 `DISPLAY`：

```bash
echo $DISPLAY
```

常见输出类似：

```txt
/private/tmp/com.apple.launchd.xxxxxx/org.xquartz:0
```

这说明 Terminal 已经连接到 XQuartz。

> [!warning]
> macOS 上一般不要手动把本地 `DISPLAY` 写成 `localhost:0`。XQuartz 默认使用自己的 socket 路径，强行覆盖反而容易导致认证失败。

## 确认本地 xauth

XQuartz 会提供本地 `xauth`。检查：

```bash
which xauth
```

常见路径是：

```txt
/opt/X11/bin/xauth
```

如果 SSH 连接时提示找不到 `xauth`，可以在 macOS 的 `~/.ssh/config` 里显式写上这个路径，后面会给出示例。

# 4. 服务器端配置

服务器需要允许 X11 转发。检查 `/etc/ssh/sshd_config`：

```txt
X11Forwarding yes
X11DisplayOffset 10
```

修改后重启 SSH 服务：

```bash
sudo systemctl restart sshd
```

有些发行版服务名是 `ssh`：

```bash
sudo systemctl restart ssh
```

同时确认服务器安装了 `xauth`：

```bash
which xauth
```

如果没有输出，需要安装：

```bash
sudo apt install xauth
# 或
sudo yum install xorg-x11-xauth
```

没有管理员权限时，也可以用 conda 安装：

```bash
conda install -c conda-forge xauth
```

> [!tip]
> `xauth` 用来生成和管理 X11 访问凭证。很多 X11 转发失败，根源不是 `DISPLAY`，而是本地或服务器缺少 `xauth`。

# 5. SSH config 推荐写法

建议把 X11 转发参数写进 SSH 配置文件，之后就不用每次手动加 `-X`。

Windows 配置文件一般在：

```txt
C:\Users\你的用户名\.ssh\config
```

可以这样写：

```txt
Host myserver
    HostName 192.168.1.100
    User yourname
    ForwardX11 yes
    ForwardX11Trusted no
    XAuthLocation "C:\Program Files\VcXsrv\xauth.exe"
```

macOS 配置文件一般在：

```txt
~/.ssh/config
```

可以这样写：

```txt
Host myserver
    HostName 192.168.1.100
    User yourname
    ForwardX11 yes
    ForwardX11Trusted no
    XAuthLocation /opt/X11/bin/xauth
```

之后直接连接：

```bash
ssh myserver
```

也可以临时使用：

```bash
ssh -X user@server
```

或使用信任模式：

```bash
ssh -Y user@server
```

| 方式 | 含义 | 适用场景 |
|---|---|---|
| `ssh -X` | 非信任模式 | 日常推荐 |
| `ssh -Y` | 信任模式 | 可信服务器、部分 GUI 程序报错时 |

如果 `ssh -X` 可以连上但图形程序报错，可以试一次 `ssh -Y`。某些老旧 GUI 程序对非信任模式支持不好。

# 6. 常见问题

## Windows 和 Xshell / Xmanager 共存

如果同时安装了 Xmanager 和 VcXsrv，可能会发生 display 端口冲突。

常见情况是：Xmanager 占用了 `:0`，VcXsrv 自动切到 `:1`，但 `DISPLAY=localhost:0` 仍指向旧位置。

解决方法：

| 方法 | 操作 |
|---|---|
| 固定 display 编号 | VcXsrv 使用 `:1`，PowerShell 中设置 `DISPLAY=localhost:1` |
| 按需启动 | 使用 VcXsrv 时关闭 Xmanager，使用 Xshell 时关闭 VcXsrv |

## macOS 本地 DISPLAY 为空

如果 macOS 上执行 `echo $DISPLAY` 没有输出，通常是 XQuartz 没有正确初始化。

可以按顺序尝试：

1. 打开 XQuartz；
2. 完全退出并重新打开 Terminal / iTerm2；
3. 注销并重新登录 macOS；
4. 重新检查 `echo $DISPLAY`。

不要直接把 `DISPLAY` 写死到 `~/.zshrc`。macOS 上这个值通常由 XQuartz 动态管理。

## 提示 No xauth data

连接时如果看到类似提示：

```txt
Warning: No xauth data; using fake authentication data for X11 forwarding.
```

优先检查两边的 `xauth`：

```bash
which xauth
```

在服务器上要能找到 `xauth`，在本地也要能找到。Windows 可以指定 VcXsrv 的 `"C:\Program Files\VcXsrv\xauth.exe"`，macOS 可以指定 `/opt/X11/bin/xauth`。

## tmux 中 DISPLAY 失效

tmux 会保留旧会话的环境变量。如果你重新 SSH 登录，新的 `DISPLAY` 可能已经变了，但 tmux pane 里仍是旧值。

临时同步：

```bash
export DISPLAY=$(tmux show-env DISPLAY | cut -d= -f2)
```

也可以写入服务器的 `~/.zshrc` 或 `~/.bashrc`：

```bash
if [ -n "$TMUX" ]; then
    export DISPLAY=$(tmux show-env DISPLAY 2>/dev/null | cut -d= -f2)
fi
```

> [!note]
> 如果经常在 tmux 里跑图形程序，这一步很关键。

# 7. 测试

连接服务器后检查：

```bash
echo $DISPLAY
```

正常会看到类似：

```txt
localhost:10.0
```

注意这里看到的是服务器里的 `DISPLAY`，不是本地电脑里的 `DISPLAY`。服务器端出现 `localhost:10.0` 这类值，通常说明 SSH 已经为 X11 转发创建了隧道。

安装测试工具：

```bash
sudo apt install x11-apps
# 或
sudo yum install xorg-x11-apps
```

运行：

```bash
xeyes
```

如果本地弹出窗口，说明 X11 转发配置成功。

# 总结

X11 转发的关键点其实只有四个：

1. 本地启动 X Server：Windows 用 VcXsrv，macOS 用 XQuartz；
2. Windows 需要设置本地 `DISPLAY`，macOS 通常让 XQuartz 自动管理；
3. SSH 启用 `ForwardX11`；
4. 本地和服务器都要能找到 `xauth`。

如果窗口打不开，优先检查 `DISPLAY`、`xauth`、本地 X Server 是否正在运行。Windows 还要注意 VcXsrv 是否被 Xmanager 占用了 display 编号；macOS 则优先检查 XQuartz 是否启动，以及 Terminal 是否在安装后重新打开过。

## 相关阅读

- [[vscode-remote-ssh-guide|VS Code 连接服务器及使用注意事项]]
- [[claude-code-server|如何在服务器上使用 Claude Code]]

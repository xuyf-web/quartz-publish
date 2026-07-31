---
title: "如何在服务器上使用 Claude Code"
description: "介绍通过 SSH 端口转发和独立代理配置在远程服务器上使用 Claude Code。"
date: 2026-07-03
collection: "科研工作流与工具链"
permalink: /claude-code-server
tags:
  - Claude Code
  - SSH
  - 代理配置
  - AI 编程
---
Claude Code 在本地用起来很直接，放到服务器上就会多点麻烦：服务器如何访问 Claude 服务。

当然可以在服务器单独部署代理，但更常用的做法是：用 SSH 隧道把服务器上的请求转回本地电脑，再从本地代理出去。

> [!warning]
> 本篇笔记不会涉及如何在本地电脑使用 Claude Code 的问题

# 一、先搞清楚整体路径

很多科研服务器、集群登录节点不能直接访问 Claude 官方服务，但本地电脑可以。如果本地电脑已经有可用代理，就可以让服务器通过 SSH 远程端口转发借用这条链路。

整体方向是这样：

```txt
服务器上的 Claude Code
        ↓
服务器 127.0.0.1:7897
        ↓ SSH RemoteForward
本地电脑 127.0.0.1:7897
        ↓
本地代理
        ↓
Claude 官方服务
```

这里最关键的是 `RemoteForward`。它会在服务器上打开一个本地端口。服务器访问这个端口时，请求会沿着当前 SSH 连接回到你的本地电脑，再交给本地代理处理。

开始配置前，先确认三件事：

- 本地电脑可以正常访问 Claude；
- 本地代理正在运行，并且知道端口号，比如 `7890` 或 `7897`；
- 本地可以正常 SSH 登录服务器。

下面统一用 `7897` 举例。

# 二、建立 SSH 远程端口转发

如果平时用终端登录服务器，建议把转发写进本地的 `~/.ssh/config`。这样以后终端、VS Code Remote-SSH、scp、rsync 都能共用同一个主机别名。

## 写入 `~/.ssh/config`

在本地电脑的 `~/.ssh/config` 里加一段：

```sshconfig
Host server
    HostName your.server.ip
    User your_username
    Port 22
    RemoteForward 7897 127.0.0.1:7897
```

其中这一行最重要：

```sshconfig
RemoteForward 7897 127.0.0.1:7897
```

它的意思是：在服务器上监听 `127.0.0.1:7897`，然后把流量转到本地电脑的 `127.0.0.1:7897`。

保存后重新登录服务器：

```bash
ssh server
```

只要这个 SSH 连接还在，服务器就可以通过 `127.0.0.1:7897` 访问本地代理。连接断开后，这个转发端口也会消失。

## Xshell 里的对应设置

如果平时用 Xshell，可以在会话设置里加隧道：

```txt
会话属性 -> 连接 -> SSH -> 隧道 -> 添加
```

按下面这样填：

| 字段 | 值 |
|---|---|
| 类型 | 远程（传入） |
| 源主机 | `localhost` |
| 侦听端口 | `7897` |
| 目标主机 | `127.0.0.1` |
| 目标端口 | `7897` |

“侦听端口”是服务器上开的端口，“目标端口”是本地代理端口。两者可以相同，也可以不同；只要前后配置一致即可。

# 三、让 Claude Code 使用这条代理

隧道建好后，还要告诉服务器上的程序走这个端口。这里有两种做法：临时给当前终端设置代理，或者只给 Claude Code 单独写配置。

## 先用临时环境变量测试

登录服务器后，先在当前终端里设置代理：

```bash
export http_proxy=http://127.0.0.1:7897
export https_proxy=http://127.0.0.1:7897
export HTTP_PROXY=http://127.0.0.1:7897
export HTTPS_PROXY=http://127.0.0.1:7897
```

然后测试：

```bash
curl -I https://api.anthropic.com
```

这里不一定要看到真正的业务成功。没有认证信息时，API 返回错误也正常。重点是不要出现下面这些网络错误：

```txt
Connection refused
Could not resolve host
timed out
```

只要能收到远端 HTTP 响应，就说明本地代理、SSH 隧道和服务器端口基本连通了。

## 给 Claude Code 单独写配置

上面设置的环境变量会让服务器上所有程序的网络都用本地的，可能导致其他进程变慢。如果只想让 Claude Code 走代理，可以编辑服务器上的：

```bash
~/.claude/settings.json
```

写入：

```json
{
  "env": {
    "HTTP_PROXY": "http://127.0.0.1:7897",
    "HTTPS_PROXY": "http://127.0.0.1:7897"
  }
}
```

这个办法比把代理写进 `.bashrc` 干净。它只影响 Claude Code，不会改变 Git、conda、curl 或服务器上其他命令的网络行为。

## 清理旧的 `ANTHROPIC_BASE_URL`

如果以前用过第三方兼容接口，服务器环境里可能还留着类似配置：

```bash
ANTHROPIC_BASE_URL=https://example.com/anthropic
```

这类变量会让 Claude Code 把请求发到自定义地址。现在如果要走官方服务，就可能遇到登录失败、OAuth 跳转异常、403 等问题。

可以先查一下：

```bash
env | grep -i anthropic
```

如果要用官方服务，就把旧的 `ANTHROPIC_BASE_URL`、`ANTHROPIC_AUTH_TOKEN` 等配置删掉或注释掉，然后重新打开终端。

# 四、VS Code、tmux 和常见排查

命令行能用，不代表 VS Code 插件、Remote-SSH 或 tmux 里一定能用。这些工具经常有自己的进程生命周期，读到的环境变量不一定和当前终端完全一致。

## VS Code 插件要分清本地和远程

在 VS Code Remote-SSH 里使用 Claude Code 插件时，先确认插件到底运行在哪里：有些插件装在本地，有些装在远程服务器。

建议按这个顺序查：

- 插件安装在本地还是远程；
- 本地是否有 `~/.claude/settings.json`；
- 服务器是否有 `~/.claude/settings.json`；
- 是否残留旧的 `ANTHROPIC_BASE_URL`；
- VS Code 重启后配置是否真的生效。

我更倾向于优先改 Claude Code 自己的 settings，而不是只在 `.bashrc` 里写 `export`。`.bashrc` 对交互式终端有效，但插件进程不一定按同样的方式启动。

## tmux 会保留旧环境

服务器上经常会配合 `tmux` 使用。这里容易踩一个小坑：`tmux` 会保留会话创建时的环境变量。

如果你先开了 tmux，后来才重新 SSH 登录并建立 `RemoteForward`，旧 pane 里可能没有新的代理变量。可以在 tmux 里重新设置：

```bash
export HTTP_PROXY=http://127.0.0.1:7897
export HTTPS_PROXY=http://127.0.0.1:7897
```

更省事的办法是直接新开一个 tmux 会话。

## 常见报错怎么查

`Connection refused` 通常说明服务器上的 `127.0.0.1:7897` 没有通。重点检查 SSH 连接是否还在、`RemoteForward` 有没有写错、本地代理端口是否正确，以及服务器是否允许远程端口转发。

`timed out` 更像是本地代理或本地网络本身不可用。先在本地电脑测试 Claude，再回头看 SSH 隧道。

命令行能用但插件不能用时，优先查 `~/.claude/settings.json`、插件安装位置、VS Code 是否重启，以及旧的 `ANTHROPIC_BASE_URL` 有没有残留。

重新登录后不能用也很常见。远程端口转发依赖当前 SSH 连接，断开后服务器上的转发端口会一起消失。重新登录后，先跑一遍：

```bash
curl -I https://api.anthropic.com
```

## 安全边界

在服务器上用 AI 编程工具前，最好先想清楚哪些内容不能交给外部服务处理。

至少注意下面几件事：

- 不要把 API key、token、cookie 写进项目仓库；
- 不要提交包含账号信息的配置文件；
- 不要让工具随便读取无关数据目录；
- 多人服务器上只在自己的账户和项目目录里使用；
- 未公开论文、内部数据、合作代码要先确认是否允许上传分析。

# 总结

在服务器上使用 Claude Code，核心就是把网络和环境变量分开处理：

1. 本地代理先能稳定访问 Claude；
2. SSH 用 `RemoteForward` 把服务器端口转回本地；
3. 服务器端让 Claude Code 走 `127.0.0.1:7897`；
4. 清掉旧的 `ANTHROPIC_BASE_URL`；
5. VS Code 插件和 tmux 单独检查环境。

配置好之后，就可以直接在服务器项目目录里让 Claude Code 看代码、改脚本、解释日志、整理运行流程。对经常在服务器上跑模型、调环境的人来说，这种用法比在服务器上长期维护一套代理更轻便。

## 相关阅读

- [[ai-models-to-agents|从 ChatGPT 到通用 Agent：AI 大模型发展进程]]
- [[tmux-server-workbench|tmux：把一个终端变成服务器工作台]]
- [[git-network|Git网络连接]]

---
title: "科研服务器上我常用的 Linux 小工具"
description: "介绍文件浏览、路径跳转、模糊搜索、资源监控和磁盘分析等 Linux 小工具。"
date: 2026-06-25
collection: "科研工作流与工具链"
permalink: /linux-research-tools
tags:
  - Linux
  - 服务器
  - 终端工具
  - 效率工具
---
长期在服务器上做模拟和数据处理，会发现效率不只取决于 CPU、内存和并行核数，还取决于你能不能快速找到文件、看懂日志、比较结果、监控资源。

这篇整理一下我在科研服务器上常用的一些 Linux 小工具。它们大多可以通过 conda、系统包管理器或 cargo 安装，用起来比传统命令更顺手。

> [!summary]
> 这不是“必须安装清单”，而是适合科研服务器工作流的效率工具清单。核心目标是：找文件更快，看日志更舒服，排查问题更直观。

# 1. eza：更好看的 ls

`eza` 可以理解为 `ls` 的现代替代品，颜色、图标、文件信息都更清晰。

![[Linux实用小工具-20251112-1.png]]

常用命令：

```bash
eza
eza -lah
eza --tree -L 2
```

适合用来看项目目录结构，尤其是模型输出目录、脚本目录、实验目录。

# 2. autojump / zoxide：快速跳转路径

服务器路径层级经常很深，比如：

```txt
/WORK/user/project/cmaq/2020_case/CCTM/scripts
```

`autojump` 和 `zoxide` 可以根据访问历史快速跳转目录。

![[Linux实用小工具-20260524.png]]

例如：

```bash
j cctm
z cctm
```

> [!tip]
> 如果你经常在多个项目、多个模式目录之间切换，这类工具能明显减少 `cd ../../..` 的次数。

# 3. fzf：模糊搜索文件

`fzf` 是交互式模糊搜索工具，可以用来找文件、找历史命令、筛选结果。

![[Linux实用小工具-20251112-2.png]]

常见用法：

```bash
find . -type f | fzf
history | fzf
```

配合 `bat` 预览文件更好用：

```bash
alias fzf='fzf --preview "bat --color=always --style=numbers --line-range=:500 {}"'
```

![[Linux实用小工具-20260524-9.png]]

# 4. colordiff：更清楚地比较文件

模型配置经常要比较两个 `namelist.input`、两个脚本或两个 Registry 文件。

`colordiff` 会给 `diff` 结果加颜色。

![[Linux实用小工具-20251112-3.png]]

```bash
colordiff file1 file2
diff -u file1 file2 | colordiff
```

# 5. btop：系统资源监控

`btop` 可以直观看到 CPU、内存、进程、磁盘和网络状态。

![[Linux实用小工具-20260524-1.png]]

适合检查：

| 场景 | 关注点 |
|---|---|
| 模式跑得慢 | CPU 是否满载 |
| 程序被杀 | 内存是否爆掉 |
| 读写很慢 | 磁盘 IO 是否拥塞 |
| 多用户服务器 | 是否有人占用大量资源 |

# 6. yazi：交互式文件管理器

`yazi` 是终端里的文件管理器，适合浏览目录、预览文件、快速移动和删除。

![[Linux实用小工具-20251112-5.png]]

![[Linux实用小工具-20260524-2.png]]

如果你习惯图形界面的文件管理器，但又必须在服务器终端里工作，可以试试它。

# 7. ripgrep：快速搜索文件内容

`ripgrep` 命令是 `rg`，可以看作更快、更现代的 `grep`。

![[Linux实用小工具-20251112-6.png]]

例如在项目里查某个变量：

```bash
rg "chem_opt"
rg "auxhist13" .
rg -n "GRID_NAME" CCTM/scripts
```

> [!note]
> 查模式脚本、配置文件、报错日志时，`rg` 通常比 `grep -R` 更快、更舒服。

# 8. dust / ncdu：磁盘空间分析

模式输出文件很容易把磁盘占满。`dust` 可以更直观地看目录占用。

![[Linux实用小工具-20251112.png]]

```bash
dust
dust -d 2
```

类似工具还有 `ncdu`，适合交互式清理大文件。

# 9. tmux：多窗口协作和断线保护

`tmux` 是服务器工作流里的核心工具之一。

![[Linux实用小工具-20260524-3.png]]

它最重要的作用不是“分屏”，而是：

- SSH 断开后任务仍然保留；
- 一个窗口看日志，一个窗口改脚本，一个窗口查资源；
- 长时间任务可以放在 session 里持续跟踪。

常用命令：

```bash
tmux new -s work
tmux attach -t work
tmux ls
```

# 10. bat：更好看的 cat

`bat` 是 `cat` 的增强版，支持语法高亮和行号。

![[Linux实用小工具-20260524-4.png]]

```bash
bat namelist.input
bat run_cctm.csh
```

还可以替代 `tail -f` 查看日志：

```bash
batfollow() {
  if [[ $# -lt 1 ]]; then
    echo "Usage: batfollow <file> [bat-language]" >&2
    return 1
  fi
  local file="$1"
  local lang="$2"
  if [[ -n $lang ]]; then
    tail -f -- "$file" | bat --paging=never -l "$lang"
  else
    tail -f -- "$file" | bat --paging=never --file-name "$file"
  fi
}
```

效果类似：

![[Linux实用小工具-20260524-10.png]]

# 11. starship：更美观的命令行提示符

`starship` 可以让 shell 提示符显示 Git 分支、Python 环境、当前目录等信息。

![[Linux实用小工具-20260524-5.png]]

它对 zsh/fish 等 shell 支持较好。如果服务器默认是 bash，配置体验可能不如 zsh。

# 总结

如果只选最推荐的几个，我会按这个顺序装：

| 优先级 | 工具 | 解决的问题 |
|---|---|---|
| 1 | `rg` | 快速查配置和日志 |
| 2 | `tmux` | 断线保护和多窗口工作 |
| 3 | `bat` | 更舒服地看脚本和日志 |
| 4 | `fzf` | 快速找文件和历史命令 |
| 5 | `btop` | 监控服务器资源 |
| 6 | `dust` / `ncdu` | 找出占空间的大文件 |

这些工具不改变科研问题本身，但能显著减少重复劳动。对长期在服务器上跑 WRF、CMAQ、WRF-Chem 或机器学习实验的人来说，很值得配置一次。

## 相关阅读

- [[tmux-server-workbench|tmux：把一个终端变成服务器工作台]]
- [[bark-job-notifications|用 Bark 发通知：掌控任务进度]]
- [[research-automation|科研自动化流程]]

---
title: "crontab：你的自动化操作基石"
description: "从时间语法开始，讲清 crontab 的路径、工作目录、环境变量、依赖顺序和上线检查。"
date: 2026-08-06
collection: "科研工作流与工具链"
permalink: /crontab-automation-foundation
tags:
  - crontab
  - Linux
  - 科研自动化
  - 定时任务
---

当科研或主要工作依托在 Linux 服务器上进行时，使用 `crontab` 命令设定周期性任务，实现自己的定制需求。在 Windows 或者 Mac 系统上也有对应的命令可以实现相同的效果。

我会用这个定时命令来执行定期的下载数据、查看空间存储、文件备份等任务

> [!summary]
> 使用 Crontab 命令定制自己的科研自动化流程

# cron 命令怎么用

用户的定时任务通常用 `crontab -e` 编辑。每一条任务由五个时间字段和一条命令组成，从左到右依次是分钟、小时、每月第几日、月份和星期几。

```text
┌───────────── 分钟      0–59
│ ┌─────────── 小时      0–23
│ │ ┌───────── 每月日期  1–31
│ │ │ ┌─────── 月份      1–12
│ │ │ │ ┌───── 星期      0–7，0 和 7 通常都表示周日
│ │ │ │ │
* * * * *  command
```

例如：

| 写法 | 执行时间 |
|---|---|
| `17 10 * * 1` | 每周一 10:17 |
| `23 18 * * *` | 每天 18:23 |
| `41 8 5 * *` | 每月 5 日 08:41 |
| `*/5 * * * *` | 每 5 分钟一次 |
| `30 8 * * 1,3,5` | 每周一、三、五 08:30 |

星号 `*` 表示这个字段不限制，逗号 `,` 表示列举，短横线表示连续范围，` */5 ` 表示在当前字段允许的范围内每隔 5 个单位匹配一次。

这里有一个很容易写错的规则。当“每月日期”和“星期”都受到限制时，Cronie 等常见实现会在任意一个字段匹配时执行。下面这条会在每月 1 日和每个周一都运行，并不是“恰好落在周一的每月 1 日”。

```cron
0 0 1 * 1 /path/to/command
```

编辑完成后，就像用 vim 命令一样，用 `:wq` 或 `:x` 来保存。之后可以用 ` crontab -l ` 来查看已设定的自动化任务。

# 检查或调整自己的任务表

常用操作：

```bash
crontab -l    # 查看当前用户的任务
crontab -e    # 编辑并安装任务
crontab -r    # 删除当前用户的整张 crontab
```

`crontab -r` 删除的是整张任务表

也可以把任务表保存在普通文件里

```bash
crontab -l > /path/to/backups/crontab.backup
```

# 从第一个任务开始

假设服务器每周需要运行一次轻量检查脚本。一条便于维护的任务可以写成这样。

先准备当前用户使用的运行目录和日志目录。

```bash
mkdir -p project/run project/logs
```

```cron
20 10 * * 1 project/run.sh >> project/logs/check.log 2>&1
```

这个任务就是安排在每周一的 10:20 运行该脚本，并将结果写入 log 文件

cron 非常适合检查、下载、备份和提交作业等轻量动作。

## PATH 要显式固定

登录终端通常会读取 shell 配置，并把 conda、虚拟环境或用户软件目录加入 `PATH`。cron 不会自动复刻这套交互式会话。

因此，对于 conda 或 Python 环境，定时任务里直接调用目标环境的解释器通常更省事。

```cron
20 10 * * * /path/to/venv/bin/python project/task.py
```

这样无需依赖 `conda activate`，也避开了 `.bashrc` 中只为交互终端准备的逻辑。

## 还需注意任务启动的工作目录

cron 不会在设定任务时所在的目录启动。下面这段脚本直接读取 `config.json`，很大可能会报错失败。

```python
with open("config.json", encoding="utf-8") as file:
    config = file.read()
```

推荐在任务或脚本中明确设定路径

```sh
#!/bin/sh

cd /path/to/project || exit 1
exec /path/to/venv/bin/python /path/to/project/task.py
```

这里的 `|| exit 1` 的含义是目录不存在或磁盘没有挂载时，任务应该立刻失败，不会留在错误目录里继续运行。

## 环境变量要有明确入口

脚本如果依赖代理、数据库地址或服务凭据， cron 也不会继承它们。可以让包装脚本加载一份权限受限的环境文件。

```sh
#!/bin/sh

set -u
cd /path/to/project || exit 1

set -a
. /path/to/project/.env
set +a

: "${SERVICE_TOKEN:?SERVICE_TOKEN is required}"
exec /path/to/venv/bin/python /path/to/project/task.py
```

`.env` 需要采用当前 shell 能读取的赋值语法，例如下面这样。

```dotenv
SERVICE_TOKEN="<YOUR_API_KEY>"
```

将文件权限限制为只有本人可读写，并确保它不进入 Git。

```bash
chmod 600 /path/to/project/.env
```

# 有依赖的任务放在同一条链里

举例来说，下载完成后才做分析，备份结束后再生成报告。对于这样有明确先后顺序的自动化任务，如果把两条 cron 分别固定在 18:00 和 19:00，只能提供时间余量，无法保证上游一定在一小时内成功结束。

依赖关系明确时，让一个包装脚本按顺序调用会更可靠。

```sh
#!/bin/sh

set -u
cd /path/to/project || exit 1

/path/to/project/download.sh || exit 1
/path/to/venv/bin/python /path/to/project/analyze.py || exit 1
/path/to/project/send_report.sh
```

其中任一步失败，后面的动作都不会继续。

# 推荐先做测试后固定

每次创建新的自动化任务时，建议先设置 1 分钟一次的心跳来验证，成功后可以删除测试并恢复正式频率

最后看一眼服务器时间和时区。cron 是按运行它的系统或实现所配置的时区解释时间。

```bash
date
timedatectl
```

## 相关阅读

- [[research-automation|科研自动化流程]]
- [[bark-job-notifications|用 Bark 发通知：掌控任务进度]]

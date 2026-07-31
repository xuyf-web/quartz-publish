---
title: lsf-nodes.sh
description: 汇总 LSF CPU 节点状态、剩余槽位、作业数、CPU 利用率与内存压力。
date: 2026-07-31
tags:
  - LSF
  - Bash
  - 服务器监控
---

<div class="file-hero">
  <p>BASH · LSF · VERSION 2026-07-31</p>
  <h2>一条命令查看 CPU 计算节点</h2>
  <span>只执行查询命令，不提交、终止或修改 LSF 作业。</span>
  <a href="../../static/files/lsf-nodes.sh" download>下载 lsf-nodes.sh</a>
</div>

## 它会汇总什么

- `bjobs -w -u all`：运行作业、执行节点与已占用槽位；
- `lshosts -w`：CPU 数量与总内存；
- `lsload`：主机负载、CPU 利用率与可用内存；
- `bhosts -w`：调度器看到的主机状态。

脚本按主机名合并这些信息，输出 `ncpu`、`free`、`jobs`、`ut` 和 `mem`，并用颜色标出异常状态与较高负载。

## 安装

```bash
mkdir -p ~/bin
curl -L http://xuyf.net/static/files/lsf-nodes.sh -o ~/bin/lsf-nodes
chmod +x ~/bin/lsf-nodes
```

确保 `~/bin` 已加入 `PATH`，然后运行：

```bash
lsf-nodes cpu-
```

参数 `cpu-` 是 CPU 节点名前缀；不传参数时默认使用这个值。不同集群的 LSF 输出列可能不同，首次使用前应核对四条查询命令的表头。

返回 [[./index|文件分享]]，或查看配套的 [[./list-gpu|list-gpu.sh]]。

---
title: list-gpu.sh
description: 汇总 NVIDIA GPU 利用率、显存、温度和计算进程，并显示用户、运行时间与完整命令。
date: 2026-07-31
tags:
  - GPU
  - Bash
  - 服务器监控
---

<div class="file-hero">
  <p>BASH · NVIDIA · VERSION 2026-07-31</p>
  <h2>看清 GPU 和正在运行的计算进程</h2>
  <span>脚本读取 nvidia-smi 与 ps，不结束进程，也不修改 GPU 设置。</span>
  <a href="../../static/files/list-gpu.sh" download>下载 list-gpu.sh</a>
</div>

## 它会汇总什么

- 每张 GPU 的利用率、已用与总显存、显存比例和温度；
- 每个计算进程所在的 GPU、PID、用户、显存、运行时间和启动命令；
- GPU UUID 到可读序号的映射；
- 对 DataLoader 子进程、Jupyter kernel 和过长命令的简化显示。

## 安装

```bash
mkdir -p ~/bin
curl -L http://xuyf.net/static/files/list-gpu.sh -o ~/bin/list-gpu
chmod +x ~/bin/list-gpu
```

脚本使用 Bash 关联数组，建议使用 Bash 4 或更高版本。若登录节点没有 `nvidia-smi`，还需要修改文件开头的两个值：

```bash
GPU_NODE="gpu-node"
SELF="/shared/tools/list-gpu"
```

`GPU_NODE` 是可通过 SSH 访问的 GPU 节点，`SELF` 是该节点能读取的脚本路径。两者必须按实际集群环境设置。

返回 [[./index|文件分享]]，或查看配套的 [[./lsf-nodes|lsf-nodes.sh]]。

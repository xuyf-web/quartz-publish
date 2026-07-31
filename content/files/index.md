---
title: 文件分享
description: 可独立下载、检查和复用的脚本、配置与小型工具。
---

这里存放从文章中拆出的完整脚本与配置。每个文件都有独立说明页，文章只保留原理、使用场景和必要片段。

<div class="resource-grid resource-index-grid">
  <section class="resource-card resource-lsf">
    <div class="resource-meta"><span>BASH</span><time datetime="2026-07-31">2026-07-31</time></div>
    <h3><code>lsf-nodes.sh</code></h3>
    <p>汇总 LSF CPU 节点状态、剩余槽位、作业数、CPU 利用率和内存压力。</p>
    <div class="resource-actions">
      <a href="./lsf-nodes">查看说明</a>
      <a class="resource-download" href="../../static/files/lsf-nodes.sh" download>下载 .sh</a>
    </div>
  </section>

  <section class="resource-card resource-gpu">
    <div class="resource-meta"><span>BASH</span><time datetime="2026-07-31">2026-07-31</time></div>
    <h3><code>list-gpu.sh</code></h3>
    <p>汇总 NVIDIA GPU 即时状态与计算进程，并补充用户、运行时间和完整命令。</p>
    <div class="resource-actions">
      <a href="./list-gpu">查看说明</a>
      <a class="resource-download" href="../../static/files/list-gpu.sh" download>下载 .sh</a>
    </div>
  </section>
</div>

> [!important] 使用边界
> 这些文件是可以修改的参考实现，不是适用于所有集群的即装即用程序。运行前请检查命令表头、节点命名、共享目录和权限设置。

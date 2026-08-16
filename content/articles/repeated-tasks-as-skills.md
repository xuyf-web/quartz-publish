---
title: "这个小问题，我还是单独写成了 Skill"
description: "用 quiverkey 说明什么样的重复工作适合交给 Skill，以及 description 如何帮助 Agent 找到它。"
date: 2026-08-16
collection: "科研工作流与工具链"
permalink: /repeated-tasks-as-skills
tags:
  - Codex
  - Skill
  - 科研绘图
---

我画风场图时，经常在最后重新调整角落里的参考箭头。箭头要标出参考风速和单位，位置还得跟着图的布局调整，而且不是通用的，到了下一张图还要重新变化。

这类事情就适合写成 Skill。如果一个场景经常出现，其中有些功能反复用到，每次又会遇到不同的输入或环境。完全固定的流程交给脚本更省事；很少出现的问题，直接在对话里说明就够了。Skill 适合处理中间这部分工作。

我保留的 `quiverkey-legend` 就是一个例子。Matplotlib 用 `quiver` 画风矢量，再用 `quiverkey` 添加带数值的参考箭头。[Matplotlib 的 QuiverKey 文档](https://matplotlib.org/stable/api/_as_gen/matplotlib.quiver.QuiverKey.html)列出了位置、坐标系和标签方向等参数。函数本身并不复杂，具体取值却要跟着图变。参考风速要和数据量级相称，多子图还要选对坐标轴，免得图例挡住主要风场。

现有的 Python 和绘图工具已经能生成 Matplotlib 代码，我没有再装一个覆盖整套绘图流程的 Skill。`quiverkey-legend` 只补上这块反复返工的细节。它告诉 Agent 怎么根据数据范围和子图布局选参数，并在导出后检查图例有没有遮挡。遇到不同图件时，参数可以变，检查标准保持一致。

写好内容还不够，Skill 要先被 Agent 找到。[OpenAI 的 Skill 文档](https://learn.chatgpt.com/docs/build-skills)说明，Codex 一开始会看到 Skill 的名称、`description` 和文件路径，决定使用以后才读取完整的 `SKILL.md`。用户没有直接点名 Skill 时，是否触发主要取决于 `description` 能不能匹配当前任务。

所以 description 要写用户会怎样提出问题。`quiverkey-legend` 可以写“为风矢量图添加参考箭头，根据数据单位和子图布局调整位置”，范围到这里就停。只写“帮助绘图”太宽，只写函数名又可能漏掉自然语言里的说法。

以上是一个自定义小型 skill 的例子，还有许多其它场景适用的技能，联合帮助我更好地处理数据和分析流程。

## 相关阅读

- [[skill-library-pruning|skill 越来越多，别太上头]]

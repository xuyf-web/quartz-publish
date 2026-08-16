---
title: "Superpowers：使用 agent 必不可少的 skill"
description: "介绍 Superpowers 中的 brainstorming、writing-plans 和 subagent-driven-development，以及它们如何把 Agent 开发约束在一套可检查的流程中。"
date: 2026-08-16
collection: "科研工作流与工具链"
tags:
  - AI编程
  - AgentSkills
  - 软件开发
  - VibeCoding
permalink: /superpowers-agent-skills
---

让编程 Agent 修改一个稍复杂的项目时，问题经常出现在代码之外。需求只说了一半，它已经开始创建文件；测试失败后，它连续改了几处，却没有确认错误来自哪里；最后看到一条成功输出，便告诉你任务已经完成……

代码生成得快，并不会自动带来可靠的开发过程。任务越长，前面留下的一点歧义越容易传到后面的实现、测试和交付里。

今天介绍 `superpowers` 这一重要的 skill，目前的应用面非常广泛。

> [!summary]
> Superpowers 用一组协同 skill 约束需求、计划、执行和验证，让 Agent 动手前先确认，完成前先验证。

# Superpowers 如何约束开发流程

[Superpowers](https://github.com/obra/superpowers) 可以说是当前 agent 中必不可少的一组核心 skill 了，目前在 GitHub 上有 273 k 个 star。

![Superpowers 项目页面](<../assets/Superpowers：使用 agent 必不可少的 skill-20260816-1.png>)

**Superpowers 对流程控制的要求比较强** 新功能先确认设计，多步骤任务先写计划，实现交给边界清楚的执行者，代码修改还要经过测试和审查。

**这套方法有明显成本** 沟通轮次会增加，计划和测试需要时间，多 Agent 协作也会消耗更多上下文与计算资源。

## brainstorming

`brainstorming` 会在任务开始前读取项目现状，确认目的、限制和验收条件，再提出设计方案。

简单任务可以只写短设计，复杂任务需要完整规格，但都要经过用户确认后才能开工。

`brainstorming` **能把模糊想法压成可以判断的设计，但不会替用户决定需求**。优先级和取舍仍由用户确定。

## writing-plans

需求确认后，`writing-plans` 会列出需要修改的文件及其职责，再按能够独立测试和审查的边界拆分任务。

每一步通常只对应一个小动作，例如写失败测试、确认失败、补上最少实现、重新验证和提交。计划还会写明路径、接口、测试命令和预期结果，不允许用“稍后增加测试”之类的占位语。

## subagent-driven-development

多 Agent 共享整段历史时，无关信息会占用上下文，紧密耦合的修改也容易彼此覆盖。

`subagent-driven-development` 用一个**协调者**管理计划。每个子 Agent 只接收当前任务所需的说明、约束和接口信息，主会话负责排序、裁决和审查。

一个任务完成后，流程不会直接把它标记为成功。**审查者**会读取实际修改，检查它是否符合规格，以及代码结构、测试和维护性是否合格。

## 还有其它 skills

除了前面展开的三项，Superpowers 还包含 11 个 skill。它们主要负责测试、调试、并行、代码审查和分支收尾等环节。

| Skill | 作用 |
| --- | --- |
| `using-superpowers` | 按任务选择执行流程 |
| `test-driven-development` | 先写失败测试再实现 |
| `systematic-debugging` | 定位根因后再修复 |
| `verification-before-completion` | 完成前重跑验证 |
| `executing-plans` | 按计划逐项执行 |
| `dispatching-parallel-agents` | 并行处理独立任务 |
| `requesting-code-review` | 按规格发起代码审查 |
| `receiving-code-review` | 核实审查意见再修改 |
| `using-git-worktrees` | 创建隔离工作区 |
| `finishing-a-development-branch` | 验证并完成分支收尾 |
| `writing-skills` | 编写并测试新技能 |

# 总结

Superpowers 的定位处在模型与项目之间，负责需求确认、任务拆分、审查和完成验证。

当你不满足于 agents 时不时的方向偏移、上下文混乱等问题时，不妨主动用这套 skill 试试吧

## 相关阅读

- [[subagent-research-workflow|学会主动把任务交给 subagent]]
- [[skill-library-pruning|skill 越来越多，别太上头]]

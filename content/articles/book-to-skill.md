---
title: '一个“帮你把工具书变成 skill” 的 skill'
description: 介绍 book-to-skill 如何把工具书整理成可反复调用的 Agent Skill
date: 2026-08-16
collection: 科研工作流与工具链
tags:
  - AgentSkills
  - BookToSkill
  - 知识管理
  - WRF
permalink: /book-to-skill
---

这里推荐给大家一个 skill： `book-to-skill` ，给它一本书或一份手册，它帮你整理成 Agent 可以调用的 Skill。以后再遇到书里的问题，不用重新上传文件，也不用从目录开始翻。

[book-to-skill](https://github.com/virgiliojr94/book-to-skill) 支持 PDF、EPUB、DOCX、Markdown 等常见文档，也能一次处理一个文件夹或一组匹配文件。

如果之前没有接触过 Skill，可以先把它理解成一个给 Agent 使用的文件夹。里面的 `SKILL.md` 会说明这套知识适合在什么情况下调用，并放入最常用的内容和索引；篇幅较长的材料留在其他文件中，需要时再读。

![book-to-skill 生成的 Skill 文件结构](<../assets/我没有让 book-to-skill 直接读 WRF 手册-20260816.png>)

# 一本书会被拆分保存

转换开始后，提取器先把原文整理成文本和元数据。Agent 接着识别章节、核心概念、方法和容易误用的地方，再生成完整的 Skill。主 `SKILL.md` 负责入口，`chapters/` 保存各章内容，主题索引则把一个具体问题指向相关章节。

所以它做出来的东西仍然是可以直接打开的 Markdown 文件。比如你问到书中的某个方法，Agent 会先查主题索引，判断该读哪一章，然后再打开对应文件。

让 AI 临时阅读适合解决眼前一次性的问题，下一次对话还要重新定位材料。`book-to-skill` 把这次整理保存下来，适合以后反复查同一份资料。

它与检索增强生成（Retrieval-Augmented Generation，RAG）的处理方式也有区别。RAG 通常先切块和建立向量索引，提问时再检索相近片段；`book-to-skill` 在制作阶段整理出明确的章节和主题入口，后续由 Agent 按索引读取。

# 我的使用场景

我用它处理了 WRF-ARW User’s Guide。技术手册里的表格较多，为了能完整录入，我先用 MinerU 将 pdf 转成 Markdown，再交给 `book-to-skill`。现在运行 WRF 时，我可以让 Agent 调用这份 Skill 辅助查参数、核对配置。

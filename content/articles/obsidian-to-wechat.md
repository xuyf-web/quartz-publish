---
title: "从Obsidian直接发布笔记"
description: "通过 callout、代码、公式、高亮和图片测试 Obsidian 笔记发布到公众号的显示效果。"
date: 2024-08-29
collection: "科研工作流与工具链"
permalink: /obsidian-to-wechat
tags:
  - Obsidian
  - NoteToMP
  - Markdown
  - 内容发布
---
> [!info] 说明
> 本文用以测试 **Note to MP** 插件功能：从 Obsidian 直接发布笔记至公众号。

# 功能测试

本次使用主题样式 [^1]

#标签

**加粗**，*斜体*，==高亮==

网页链接：[NoteToMP：Obsidian一键发公众号插件使用指南](https://mp.weixin.qq.com/s/LYujo4ODEYLuq0OkzkkoCw)

* 无序列表
*
1. 有序列表
2.
- [x] 复选框 1
- [ ] 复选框 2

> 普通引用

## Callout

> [!success]
> This is Success.

> [!question]
> This is Question.

> [!attention] Attention
> This is Attention.

## 代码

代码样式 [^2]

```python
import numpy as np

a = np.arange(0,10)

# 计算选定方向的单位向量
dx = lon2 - lon1
dy = lat2 - lat1
norm = np.sqrt(dx**2+dy**2)
direction = np.array([dx/norm,dy/norm])

# 计算合成风矢量与选定方向单位向量的点积，即为所求投影的长度（含正负）
section_wind = np.zeros_like(diag_uu)
for m in range(times):
    for n in range(levels):
        for i in range(number):
            ws2 = np.array([diag_uu[m,n,i],diag_vv[m,n,i]])
            section_wind[m,n,i]=np.dot(ws2, direction)
```

## 渲染数学公式

$$
x^2+y^2=1
$$

$$
\int_{0}^{\infty } \frac{1}{x+1}
$$

## 彩色高亮

> [!failure] Failed
> 在公众号平台看不到彩色高亮

## 本地图片

![[Pasted image 20240810222646.png]]

[^1]: MWeb Smartblue
[^2]: a11y-light

## 相关阅读

- [[obsidian-overview|【软件推荐】 Obsidian]]
- [[research-automation|科研自动化流程]]

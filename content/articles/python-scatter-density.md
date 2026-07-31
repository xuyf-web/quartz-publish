---
title: "【Python】散点密度图与直方图"
description: "用 Python 组合散点密度图和边缘直方图，展示两组数据的关系与分布。"
date: 2024-04-28
collection: "大气模式与数据实操"
permalink: /python-scatter-density
tags:
  - Python
  - 数据可视化
  - 统计图
---
本文分享一种好看的统计分析图，把散点图（scatter）和直方图（histogram）结合到一起，能够展示更丰富的信息，本示例使用了六边形填充的密度图。

先上图

下面是主要代码

# 第一步：导入需要的库

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
```

# 第二步：准备数据

一般绘制散点图需要使用描述同一个变量的两组数据，比如某污染物浓度的观测值（obs）和模拟值（sim）。

在本示例中，我们使用了两个时间段的两组数据（分别为 Low 和 High），这样的绘图效果比使用单一数据更好。

本示例将数据存入 `results` dataframe 中以便使用。

# 第三步：绘图核心代码

```python
fig = plt.figure(figsize=(6, 6),dpi=300)
ax = fig.add_subplot(111)

# 六边形填充的密度图
ax.hexbin(results['sim_low'], results['obs_low'], gridsize=50, cmap='Blues', mincnt=1)
ax.hexbin(results['sim_high'], results['obs_high'], gridsize=50, cmap='Oranges', mincnt=1)

# 创建侧边的直方图
ax_sub1 = fig.add_axes([ax.get_position().x0, ax.get_position().y1,
                        ax.get_position().width, ax.get_position().height/5])
n1, bins1, patches1 = ax_sub1.hist(results['sim_low'], color='tab:blue', alpha=0.4, bins=30, edgecolor='gray')
ax_sub1.hist(results['sim_high'], color='tab:orange', alpha=0.4, bins=bins1, edgecolor='gray')

ax_sub2 = fig.add_axes([ax.get_position().x1, ax.get_position().y0,
                        ax.get_position().width/5, ax.get_position().height])
n2, bins2, patches2 = ax_sub2.hist(results['obs_low'], color='tab:blue', alpha=0.4, bins=30, edgecolor='gray', orientation='horizontal')
ax_sub2.hist(results['obs_high'], color='tab:orange', alpha=0.4, bins=bins2, edgecolor='gray', orientation='horizontal')

# 隐藏多余刻度和边框
for axe in [ax_sub1, ax_sub2]:
    axe.set_xticks([])
    axe.set_yticks([])
    axe.spines['top'].set_visible(False)
    axe.spines['right'].set_visible(False)
    axe.spines['bottom'].set_visible(False)
    axe.spines['left'].set_visible(False)
```

示例图中还添加了坐标轴标签、趋势线等信息，未在以上代码中展示。

以上代码核心思想是绘制多个子图，通过去除部分子图边框达到多子图融合的目的。

## 相关阅读

- [[python-heatmap|【Python】绘制热力图]]
- [[python-nearest-grid-point|【Python】查找最近邻格点数据]]

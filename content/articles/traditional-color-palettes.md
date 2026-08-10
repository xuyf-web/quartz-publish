---
title: "给论文图配一套传统色（附 5 组搭配）"
description: "推荐五组适合论文折线、柱状、散点和面积图的传统色配色，并提供可复制的 Matplotlib 色值。"
date: 2026-08-10
collection: "科研工作流与工具链"
tags:
  - 科研绘图
  - Matplotlib
  - 数据可视化
  - 传统色
permalink: /traditional-color-palettes
---

论文图需要配色时，最省事的办法是先看实际效果，再复制一组顺眼的色值。这里整理了五组传统色配色，覆盖折线、柱状、散点和面积图，可以直接放进 Matplotlib 使用。

> [!summary]
> 五组配色共 25 个色值，选中后复制到绘图代码即可。

# 配色推荐

![[traditional-color-palettes.png]]

第一组以靛青、朱红和赭黄为主，颜色鲜明，适合多条折线、分组柱状图等需要清楚区分类别的图。

第二组以橘色、淡蓝和陶土色为主，整体柔和温暖，适合堆叠柱状图和组成结构图。

第三组由桃红、青绿和浅粉构成，画面轻快，放在散点图、分类对比图里比较醒目。

第四组以紫色、粉色和豆绿搭配浅色背景，适合堆叠面积图，也适合需要柔和层次的图。

第五组用藏蓝作为主色，其余四种浅绿作辅助，适合突出一条主曲线，同时保留多条背景曲线。

浅米色在白底上存在感较弱，更适合背景区域、网格线和辅助填充。画数据时优先使用每组前面的颜色。

# 复制色值

```python
COLOR_SCHEMES = {
    "青绯": ["#436C85", "#B73F42", "#DE9960", "#82B29B", "#EEE6CB"],
    "陶土": ["#E76727", "#A8C3D1", "#A57E74", "#E9B693", "#EED7C6"],
    "桃青": ["#DE476A", "#76AEA6", "#D79E8F", "#E5D2C4", "#F0E0D3"],
    "藕紫": ["#7D5A8A", "#DE7294", "#90BBAA", "#E6D2C2", "#F0E0D3"],
    "青瓷": ["#165188", "#BFCF61", "#9FCBC3", "#BFD3BC", "#DDDAB4"],
}
```

需要让 Matplotlib 自动按顺序取色，可以把其中一组设成当前坐标轴的颜色循环。

```python
from cycler import cycler

colors = COLOR_SCHEMES["青绯"]
ax.set_prop_cycle(cycler(color=colors))
```

之后正常调用 `ax.plot()`、`ax.scatter()` 或 `ax.bar()`，颜色会依次使用。

# 放进图里是什么效果

![[traditional-color-examples.png]]

> [!note] 相关阅读
> 如果图中还需要同时显示中文、英文和公式，可以继续阅读 [[matplotlib-mixed-fonts|matplotlib 里如何设置中英文混排]]。

---
title: "【Python】绘制热力图"
description: "通过多个示例说明如何用 Python 绘制热力填色、数值标注和多子图热力图。"
date: 2024-04-28
collection: "大气模式与数据实操"
permalink: /python-heatmap
tags:
  - Python
  - 热力图
  - 数据可视化
---
# 前言

本文推荐一个可以方便绘制日历热力图的库：[calplot](https://pypi.org/project/calplot/)。

Calplot 是一个专门用于从 Pandas 时间序列数据生成热力图的 Python 包。该包起源于对现有项目 calmap 的分支开发，并在其基础上进行了创新性扩展。Calplot 添加了新的参数设置选项，旨在简化并增强用户对热力图样式的个性化定制过程。

安装

```bash
pip install calplot
```

目前的版本是 0.1.7.5

# 示例 1：热力填色

```python
all_days = pd.date_range('1/1/2023', periods=365, freq='D')

days = np.random.choice(all_days, 365)

events = pd.Series(np.random.randn(len(days)), index=days)

calplot.calplot(events,edgecolor='k',cmap='YlGn',yearlabel_kws={'color': 'tab:blue'})
```

其中，我们需要输入的数据 events 是具有时间索引的数组，且索引并不需要严格遵守时间顺序

```txt
print(events)
----------------
2023-07-28 0.294124
2023-09-25 -0.624967
2023-08-28 1.038235
2023-03-02 0.987323
2023-06-07 -0.017341
...
2023-04-06 -0.307937
2023-02-10 -0.476559
2023-02-08 -0.564652
2023-12-22 0.596845
2023-11-22 -0.451508
Length: 200, dtype: float64
```

# 示例 2：显示数值与图题

```python
all_days = pd.date_range('1/1/2023', periods=365, freq='D')

days = np.random.choice(all_days, 200)

events = pd.Series(np.random.randn(len(days)), index=days)

calplot.calplot(events,edgecolor='k',cmap='YlGn',yearlabel_kws={'color': 'tab:blue'},textformat='{:.0f}', textfiller=' ',colorbar=False,suptitle='TEST')
```

# 示例 3：多子图

```python
all_days = pd.date_range('1/1/2023', periods=730, freq='D')

days = np.random.choice(all_days, 400)

events = pd.Series(np.random.randn(len(days)), index=days)

calplot.calplot(events)
```

## 相关阅读

- [[python-scatter-density|【Python】散点密度图与直方图]]
- [[python-cross-section|【Python】绘制任意线段的剖面图]]

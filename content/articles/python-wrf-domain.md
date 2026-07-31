---
title: "【Python】设计与绘制WRF网格"
description: "介绍使用 Python 与 WRF Domain Wizard 设计、检查并绘制 WRF 嵌套网格。"
date: 2024-04-28
collection: "大气模式与数据实操"
permalink: /python-wrf-domain
tags:
  - Python
  - WRF
  - 网格设计
  - 地图绘制
---
本文推荐两种设计和绘制 WRF 网格区域的方法

# 方法 1：Python

使用 Python 的 salem 库可用直接读取 WRF 前处理模块 WPS 的 namelist.wps 文件信息并绘图，也可以根据绘图结果调整网格位置和大小。

```python
from salem import geogrid_simulator
import matplotlib.pyplot as plt

namelist_path = './namelist.wps' # ensure no comments in namelist
g, maps = geogrid_simulator(namelist_path)
print(maps)
fig = plt.figure(1, figsize=(5, 5))
gs = gridspec.GridSpec(1, 1)
ax = fig.add_subplot(gs[0])

# 支持添加自定义shape文件
# maps[0].set_shapefile(r"/home/province_9south.shp")

# 绘制所有domain
maps[0].set_rgb(natural_earth='lr')
maps[0].visualize(title='Domains')
'''
# 单独绘制d02
maps[1].set_rgb(natural_earth='lr')
maps[1].visualize(title='Domains')
'''
gs.tight_layout(fig)
plt.show()
```

# 方法 2：WRF Domain Wizard（在线网站）

该网站将以往需要在本地安装操作的 WRF Domain Wizard 转移到了网站上，操作更加方便快捷。

在网站上，支持用户自由选择网格范围和嵌套设计，在设置好后可以下载对应的 namelist.wps 文件。

网站地址：[WRF Domain Wizard](https://wrfdomainwizard.net/)

## 相关阅读

- [[python-wrf-cmaq-domain-map|【Python】绘制WRF-CMAQ模拟研究区域]]
- [[wrf-lcz|WRF 中如何接入 LCZ]]

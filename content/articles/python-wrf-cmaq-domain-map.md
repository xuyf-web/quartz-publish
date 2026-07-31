---
title: "【Python】绘制WRF-CMAQ模拟研究区域"
description: "读取 WRF 与 CMAQ 网格边界，并用 Python 绘制嵌套模拟区域和地形底图。"
date: 2024-04-28
collection: "大气模式与数据实操"
permalink: /python-wrf-cmaq-domain-map
tags:
  - Python
  - WRF
  - CMAQ
  - 地图绘制
---
#CSDN #知乎

本文介绍个人使用的绘制数值模型研究区域图的 Python 代码，以 WRF-CMAQ 的三层嵌套网格为例。

成图效果：

![[gridmap1.png]]

# 导入需要的库

```python
import numpy as np
import xarray as xr
import matplotlib.pyplot as plt

import cartopy.crs as ccrs
import cartopy.feature as cfeat

from cnmaps import get_adm_maps, draw_map, draw_maps,clip_contours_by_map
from cnmaps.sample import load_dem

import cmaps
from matplotlib.colors import ListedColormap
```

其中 cnmaps 用来提供地图行政边界线，cmaps 用来制作地形高程的色标。

# 读取 WRF 与 CMAQ 多层网格边界

```python
# Read and extract coordinates
def read_coordinates(wrf_file, cmaq_file):
    """
    Read GRID data from WRF and CMAQ, and extract lon and lat variables.
    """
    wrf_data = xr.open_dataset(wrf_file)
    cmaq_data = xr.open_dataset(cmaq_file)

    wrf_lon  = wrf_data['XLONG_M'].squeeze()
    wrf_lat  = wrf_data['XLAT_M'].squeeze()
    cmaq_lon = cmaq_data['LON'].squeeze()
    cmaq_lat = cmaq_data['LAT'].squeeze()

    return wrf_lon, wrf_lat, cmaq_lon, cmaq_lat

wrf_lon_d01, wrf_lat_d01, cmaq_lon_d01, cmaq_lat_d01 = read_coordinates(geo_d01, grid_d01)
wrf_lon_d02, wrf_lat_d02, cmaq_lon_d02, cmaq_lat_d02 = read_coordinates(geo_d02, grid_d02)
wrf_lon_d03, wrf_lat_d03, cmaq_lon_d03, cmaq_lat_d03 = read_coordinates(geo_d03, grid_d03)

# Extract boundary values
def extract_boundary(dataarray):
    """
    Extract boundary values from a 2D array.
    """
    top = dataarray[-1, :].values
    bottom = dataarray[0, :].values
    left = dataarray[:, 0].values
    right = dataarray[:, -1].values

    return top, bottom, left, right

# for WRF data
wrf_lon_top_d01, wrf_lon_bottom_d01, wrf_lon_left_d01, wrf_lon_right_d01 = extract_boundary(wrf_lon_d01)
wrf_lon_top_d02, wrf_lon_bottom_d02, wrf_lon_left_d02, wrf_lon_right_d02 = extract_boundary(wrf_lon_d02)
wrf_lon_top_d03, wrf_lon_bottom_d03, wrf_lon_left_d03, wrf_lon_right_d03 = extract_boundary(wrf_lon_d03)

wrf_lat_top_d01, wrf_lat_bottom_d01, wrf_lat_left_d01, wrf_lat_right_d01 = extract_boundary(wrf_lat_d01)
wrf_lat_top_d02, wrf_lat_bottom_d02, wrf_lat_left_d02, wrf_lat_right_d02 = extract_boundary(wrf_lat_d02)
wrf_lat_top_d03, wrf_lat_bottom_d03, wrf_lat_left_d03, wrf_lat_right_d03 = extract_boundary(wrf_lat_d03)

# for CMAQ data
cmaq_lon_top_d01, cmaq_lon_bottom_d01, cmaq_lon_left_d01, cmaq_lon_right_d01 = extract_boundary(cmaq_lon_d01)
cmaq_lon_top_d02, cmaq_lon_bottom_d02, cmaq_lon_left_d02, cmaq_lon_right_d02 = extract_boundary(cmaq_lon_d02)
cmaq_lon_top_d03, cmaq_lon_bottom_d03, cmaq_lon_left_d03, cmaq_lon_right_d03 = extract_boundary(cmaq_lon_d03)

cmaq_lat_top_d01, cmaq_lat_bottom_d01, cmaq_lat_left_d01, cmaq_lat_right_d01 = extract_boundary(cmaq_lat_d01)
cmaq_lat_top_d02, cmaq_lat_bottom_d02, cmaq_lat_left_d02, cmaq_lat_right_d02 = extract_boundary(cmaq_lat_d02)
cmaq_lat_top_d03, cmaq_lat_bottom_d03, cmaq_lat_left_d03, cmaq_lat_right_d03 = extract_boundary(cmaq_lat_d03)

wrf_lon_vars = []
wrf_lat_vars = []
cmaq_lon_vars = []
cmaq_lat_vars = []

for i in range(1, 4):
    wrf_lon_vars.extend([globals()[f'wrf_lon_top_d0{i}'], globals()[f'wrf_lon_bottom_d0{i}'],
                         globals()[f'wrf_lon_left_d0{i}'], globals()[f'wrf_lon_right_d0{i}']])
    wrf_lat_vars.extend([globals()[f'wrf_lat_top_d0{i}'], globals()[f'wrf_lat_bottom_d0{i}'],
                         globals()[f'wrf_lat_left_d0{i}'], globals()[f'wrf_lat_right_d0{i}']])
    cmaq_lon_vars.extend([globals()[f'cmaq_lon_top_d0{i}'], globals()[f'cmaq_lon_bottom_d0{i}'],
                         globals()[f'cmaq_lon_left_d0{i}'], globals()[f'cmaq_lon_right_d0{i}']])
    cmaq_lat_vars.extend([globals()[f'cmaq_lat_top_d0{i}'], globals()[f'cmaq_lat_bottom_d0{i}'],
                         globals()[f'cmaq_lat_left_d0{i}'], globals()[f'cmaq_lat_right_d0{i}']])

```

以上代码读取了 WRF 与 CMAQ 的网格文件，获取其网格边界线的经纬度信息，并写入到列表中，以便后续循环调用。

此处 wrf_file 是由 WRF 的前处理模块 WPS 中的 geogrid.exe 运行获得的 geo_em.d0*.nc，cmaq_file 是由 CMAQ 的气象接口模块 MCIP 运行获得的 GRIDCRO2D_D0*.nc。

这里不直接读取网格四个角的坐标，是因为 WRF-CMAQ 的网格设计一般会采用兰伯特（Lambert）投影，而不是等经纬度投影，绘图时只读取四个端点坐标会导致边界线绘制不准确。

# 选择地形高程填色的色标

```python
cmap1=cmaps.WhiteBlue_r
cmap2=cmaps.WhiteGreen_r
cmap3=cmaps.GMT_globe

list1=cmap1(np.linspace(0.2,0.85,1000))
list2=cmap2(np.linspace(0.5,0.8,40))
list3=cmap3(np.linspace(0.51,0.85,960))
ncolor=np.vstack((list1,list2,list3))
newmap=ListedColormap(ncolor)
```

本示例使用了 cmaps 库提供的 colorbar，同时使用 matplotlib 将多种 colorbar 组合，以实线更加个性化的设置。

注：本示例中没有用到自制 colorbar 的海洋（蓝色）部分

# 绘制地图底图

根据网格投影和范围设置绘图的投影和范围，并添加陆地和海洋填色，添加经纬度坐标。

```python
proj=ccrs.LambertConformal(central_longitude=114,central_latitude=28.5,standard_parallels=(15,40))
proj_shp=ccrs.PlateCarree()

fig = plt.figure(figsize=(8,8),dpi=300)
ax = fig.subplots(1,1,subplot_kw={'projection':proj})

ax.set_extent([80, 148, 5, 51], crs=proj_shp)
ax.add_feature(cfeat.LAND.with_scale('50m'))
ax.add_feature(cfeat.OCEAN.with_scale('50m'))

labelsize=12
gl=ax.gridlines(
    xlocs=np.arange(-180, 180 + 1, 10), ylocs=np.arange(-90, 90 + 1, 10),
    draw_labels=True, x_inline=False, y_inline=False,
    linewidth=0, linestyle='--', color='gray')
gl.top_labels = False
gl.right_labels =False
gl.rotate_labels=False
gl.xlabel_style={'size':labelsize}
gl.ylabel_style={'size':labelsize}

```

# 绘制地图边界线

本示例使用 cnmaps 库提供的来自高德地图的中国行政区划边界，以及填色掩膜。

```python
# with NanHai Nine-Dash Line
lons, lats, dem = load_dem()
china = get_adm_maps(country='中华人民共和国', level='国')
draw_maps(china, color='gray', linewidth=1.2)
guangdong = get_adm_maps(province='广东省', level='省')
draw_maps(guangdong, color='gray', linewidth=1)

china = get_adm_maps(country='中华人民共和国', record='first', only_polygon=True)
cs = ax.contourf(lons, lats, dem, cmap=newmap,
                 levels=np.arange(-5000,5001,100), transform=proj_shp,)
clip_contours_by_map(cs, china)
```

# 绘制网格边界线与标注

```python
wrfline = dict(linewidth=1, linestyle='--',color='k', transform=proj_shp)
cmaqline = dict(linewidth=1, linestyle='-',color='k', transform=proj_shp)

for wrf_lon, wrf_lat in zip(wrf_lon_vars, wrf_lat_vars):
    ax.plot(wrf_lon, wrf_lat, **wrfline)
for cmaq_lon, cmaq_lat in zip(cmaq_lon_vars, cmaq_lat_vars):
    ax.plot(cmaq_lon, cmaq_lat, **cmaqline)

textdict = dict(fontsize=14, color='k', transform=proj_shp)
ax.text(wrf_lon_top_d01[0],wrf_lat_top_d01[0]+0.8,'WRF D01',**textdict)
ax.text(wrf_lon_top_d02[0],wrf_lat_top_d02[0]+0.8,'WRF D02',**textdict)
ax.text(cmaq_lon_top_d01[0],cmaq_lat_top_d01[0]+0.8,'CMAQ D01',**textdict)
ax.text(cmaq_lon_top_d02[0],cmaq_lat_top_d02[0]+0.8,'CMAQ D02',**textdict)
```

这样就获得了信息丰富的研究区域图：

# 添加子图连接线

如果需要对重点关注区域（比如本例中的珠三角地区）做详细展示，可用考虑添加一个子图放大，并在两个子图之间添加连接线。

```python
from matplotlib.patches import ConnectionPatch

kw = dict(linestyle="--", color='k',zorder=3)
con1 = ConnectionPatch(xyA=(0.52, 0.337), coordsA=ax[0].transAxes,
                      xyB=(0, 0), coordsB=ax[1].transAxes,
                      axesA=ax[0], axesB=ax[1], **kw)
con2 = ConnectionPatch(xyA=(0.522, 0.398), coordsA=ax[0].transAxes,
                      xyB=(0, 1), coordsB=ax[1].transAxes,
                      axesA=ax[0], axesB=ax[1], **kw)
for con in (con1,con2):
    ax[0].add_artist(con)
```

再适当添加其它相关信息后，最终可获得如下效果图：

![[gridmap2.png]]

## 相关阅读

- [[python-wrf-domain|【Python】设计与绘制WRF网格]]
- [[arcgis-study-area-map|【ArcGIS】绘制研究区域图]]
- [[cmaq-isam|CMAQ-ISAM ：从 EmissCtrl 到 GRIDMASK]]

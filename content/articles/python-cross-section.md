---
title: "【Python】绘制任意线段的剖面图"
description: "介绍沿任意线段提取气象场、投影矢量分量并绘制垂直剖面图的方法。"
date: 2024-04-28
collection: "大气模式与数据实操"
permalink: /python-cross-section
tags:
  - Python
  - 剖面图
  - 气象数据
  - 数据可视化
---
#知乎 #CSDN

# 前言

在研究大气物理与化学过程时，仅仅绘制变量的水平空间图是不够的，我们常常需要绘制该变量在垂直空间上的变化情况。

当选取的剖面与数据坐标一致时，提取数据比较容易，如在等经纬度坐标下选取沿某指定经度/纬度的剖面数据，或是在非等经纬度坐标下选取某指定行/列索引的剖面数据。

然而，如果需要在非等经纬度坐标下选取指定经度/纬度的剖面，或者是沿倾斜直线的剖面，甚至是沿任意折线、曲线的剖面，它的数据就比较难以提取了。

本文基于上一篇笔记 [[【Python】查找最近邻格点数据]] 的思路提供一种获取任意剖面数据的简易方法。

# 1. 选定剖面位置

本文以不平行于水平网格的斜线剖面为例，指定剖面线段的两个端点坐标，使用 linspace 获得该剖面上 50 个点的坐标（均匀分布）。

```python
lon1, lat1 = 116.6, 31.1
lon2, lat2 = 117.4, 30.1

number = 50
lons = np.linspace(lon1,lon2,num=number)
lats = np.linspace(lat1,lat2,num=number)
```

事实上，后面的处理方法与直线与否无关，因此只要给出指定的剖面上各点的坐标即可，无论是直线还是曲线都可以。

# 2. 根据坐标提取数据

根据指定剖面上各点的经纬度坐标，依照最近邻的方式提取格点数据。

```python
x_index=[]
y_index=[]

for i in range(number):
    out_x, out_y = findpoint(lons[i],lats[i],dataarray)
    x_index.append(out_x)
    y_index.append(out_y)

data_selected = dataarray.isel(x=x_index, y=y_index)
```

data_selected 就是沿剖面各点获得的距离最近的数据。

由于 dataarray.isel(x=x_index, y=y_index) 中 x_index 与 y_index 均为一维数组，因此这样获得的 data_selected 在水平空间上并不是我们想要的一条线（指定的剖面），而是以指定剖面为对角线的矩形。

![[绘制剖面图1.png]]

因此我们还要做一个处理，即提取该数组对角线数据，舍弃其余无用的数据。

```python
diag = np.diagonal(data_selected, axis1=2, axis2=3)
```

这里指定两个轴分别是 2 和 3（即数组的第 3 和第 4 个维度），是因为我的数组是 4 维的（time×level×lon×lat）。

在选定某时刻后，就得到了可以用于绘图的剖面数据（level×numbers）

# 3. 处理矢量数据

以上数据处理部分仅提取了浓度等标量场，如果需要处理风场这样的矢量数据，则需要多一道工序。

我们在绘制风场时会用 u 风和 v 风合成，但简单合成后的风向和风速不能直接画到斜向剖面上，需要计算该风矢量在指定剖面上的投影，关键在于计算合成风与剖面的夹角θ。

![[绘制剖面图2.png]]

```python
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

其中 diag_uu 和 diag_vv 分别是经过第二步对角线提取后位于剖面上的 u 矢量和 v 矢量数据

# 4. 绘制剖面图

首先根据剖面位置准备好 x 轴的经纬度刻度标签，这里用了 6 个标签。

```python
xlabels = []
for i in range(6):
    x = lon1 + (lon2 - lon1) / 5 * i
    y = lat1 + (lat2 - lat1) / 5 * i
    xlabels.append(f"{x:.1f}E\n{y:.2f}N")
```

准备好数据以后就可以照常绘制剖面图了。本示例中除浓度场和风场外，还加入了地形填色。

```python
xx = np.arange(0,number)
xgrid = np.tile(xx,(nlevel,1))
ygrid = diag_ht[0,:,:]

cmin=120
cmax=181
clevel=np.arange(cmin,cmax,1)

fig = plt.figure(figsize=(9,6),dpi=300)
ax = fig.subplots(1,1)

# contour map
cp=ax.contourf(xgrid.T,ygrid.T,diag[-2,:,:].T,
                        cmap='Spectral_r',levels=clevel,extend='both')

# Domain Height
ax.fill_between(xgrid.T[:,0],0,ygrid.T[:,0],where=ygrid.T[:,0]>0,facecolor='k')

# set label and ticks
ax.set_xticks([0,10,20,30,40,49])
ax.set_xticklabels(xlabels,fontsize=16)
ax.set_yticks(np.arange(0,2001,500))
ax.set_yticklabels(ax.get_yticks(),fontsize=16)
ax.set_ylabel('Altitude (m)',fontsize=16,fontweight='bold')
ax.set_xlim(0,number-1)
ax.set_ylim(0,2001)

# wind quiver
interval=3
q=ax.quiver(xgrid[0:nlevel:interval,0:number:interval],
                ygrid[0:nlevel:interval,0:number:interval],
                p[-2,0:nlevel:interval,0:number:interval],
                diag_ww[-2,0:nlevel:interval,0:number:interval]*50,
        color='k',alpha=1,scale=200,headwidth=3)


# set titles
ax.set_title('Plot Sections by Evan',fontweight='bold',size=20)

# share colorbar
fig.subplots_adjust(right=0.9)
position= fig.add_axes([0.92,0.15,0.015,0.7])
cbar=fig.colorbar(cp,cax=position)
cbar.set_ticks(np.arange(cmin,cmax+1,10))

plt.show()
```

成图效果如下

![[绘制剖面图3.png]]

# 总结

根据这个思路，可以提取任意自定义的截面数据并绘图，只不过在处理不规则截面的矢量数据时较为复杂。

此外，在 metpy 库中有一个 metpy.interpolate.cross_section 的函数，可以更方便地创建直线式的剖面，但作者尝试后对 wrfout 数据尝试成功了，但处理 CMAQ 数据则出现了报错，也因此作者采用了上述更麻烦的自定义方法。

## 相关阅读

- [[wrf-vertical-coordinates|WRF｜垂直高度的换算]]
- [[python-wrf-domain|【Python】设计与绘制WRF网格]]

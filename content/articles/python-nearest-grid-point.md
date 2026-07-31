---
title: "【Python】查找最近邻格点数据"
description: "介绍使用 xarray 或自定义方法为站点经纬度查找最近邻格点数据。"
date: 2024-04-28
collection: "大气模式与数据实操"
permalink: /python-nearest-grid-point
tags:
  - Python
  - xarray
  - 气象数据
  - 格点数据
---
#CSDN #知乎

我们使用区域数值模型获得的是网格化的数据（一般是 nc 文件），它的水平空间分辨率一般在 3~36km 不等。

有时我们需要提取指定位置的数据与站点观测数据做比较。本文分享找到指定位置最近邻格点数据的方法。

# xarray.sel()

如果你要查找的网格数据的坐标维度均为一维的，如在 ERA5 下载的等经纬度投影的网格数据，可以直接使用 xarray 提供的 sel() 方法。

```python
import xarray as xr
ds = xr.open_dataset('your_file.nc')
data = ds['chosen_variable']

# 指定站点经纬度
plon = 120
plat = 40
# 查找最近数据点
data_selected = data.sel(longitude=plon, latitude=plat, method='nearest')
```

使用 sel(method='nearest') 方法可以找到距离指定经纬度最近的坐标点，并输出该位置的值。

# findpoint

如果你的网格数据不是等经纬度投影，如运行 CMAQ 等区域数值模式获得的结果，大多数情况下经纬度信息和网格的行列信息 (ROW, COL) 不能一一对应，因此数据的坐标维度出现了二维，情况较为复杂。

```txt
Coordinates:
* time (time) datetime64[ns] 2019-09-01 ... 2019-09-30T23:00:00
* level (level) float64 1e+03 998.0 995.8 993.4 ... 859.5 833.8 804.0
   latitude (y, x) float32 ...
   longitude (y, x) float32 ...
```

注：此处仅作示意，该数据是经过我后处理以后的结果，将经纬度坐标与浓度数据写入到了一个文件中，因此这样的表示方式并不通用。

在这种情况下，我们可以使用下面的函数，遍历计算网格点与指定经纬度的距离，选择距离最短的一个点，返回其在数据中的坐标索引。

```python
def findpoint(plon, plat, dataarray):
    """
    plon: longitude of the point
    plat: latitude of the point
    dataarray: xarray dataarray that contains coordinates 'longitude' and 'latitude'
    """

    # Compute the distances between each grid point and the specified [lon, lat] location
    distances = ((dataarray.longitude - plon)**2 + (dataarray.latitude - plat)**2)**0.5

    # Find the minimum distance and corresponding index in the flattened array
    min_distance = distances.min()
    min_index = distances.argmin()

    # Convert the flattened index to 2D index
    y_index, x_index = np.unravel_index(min_index, dataarray[0,0,:,:].shape)

    return x_index, y_index
```

获得距离指定位置最近的格点索引后，就可以使用 isel() 提取该点的值

```python
x_index, y_index = findpoint(plon, plat, dataarray)
nearest_data = dataarray.isel(x=x_index, y=y_index)
```

在使用本函数时，需要根据数据情况，调整函数中 (lon,lat) 或 (x,y) 的维度命名，以及 dataarray 的维度数量（本例中是四维数据）。

## 相关阅读

- [[python-wrf-domain|【Python】设计与绘制WRF网格]]
- [[python-scatter-density|【Python】散点密度图与直方图]]

---
title: "WRF｜垂直高度的换算"
description: "区分 WRF 中气压高度、位势高度、海拔高度与离地高度，并给出常用换算方法。"
date: 2026-07-02
collection: "大气模式与数据实操"
permalink: /wrf-vertical-coordinates
tags:
  - WRF
  - 垂直坐标
  - 气象数据
---
做 WRF 后处理时，经常会遇到一个看似简单、但很容易混淆的问题：WRF 的垂直层到底对应多高？

WRF 输出里常见的高度概念至少有三类：气压高度、位势高度、离地高度。它们不是同一个东西，适用场景也不一样。本文整理一下在处理 WRF/WRF-Chem 数据时常用的换算方法。

> [!summary]
> 如果只想做剖面图、垂直廓线或高度筛选，最常用的是：
>
> $$Z=\frac{PHB+PH}{g}-HGT$$
>
> 其中 `PHB + PH` 是总位势，`HGT` 是地形高度。

# 1. 气压高度：eta 层和气压的关系

WRF 在垂直方向采用 eta 坐标，其与气压的关系为：

$$\eta = \frac{P-P_{top}}{P_{bottom}-P_{top}}$$

反过来即可得到某一 eta 层对应的气压：

$$P=\eta \cdot (P_{bottom}-P_{top})+P_{top}$$

一般情况下，可以近似取：

| 参数           | 含义                    | 常见取值       |
| ------------ | --------------------- | ---------- |
| $P_{bottom}$ | 近地面参考气压               | 1000 （hPa） |
| $P_{top}$    | 模式层顶气压                | 50 （hPa）   |
| $\eta$       | namelist 中设置的垂直 eta 层 | 0-1（数组）    |

示例：

```python
import numpy as np

eta = np.array([
    1.000, 0.995, 0.990, 0.985, 0.980, 0.970,
	 ...
	0.200, 0.150, 0.100, 0.050, 0.000,
])

pres = eta * (1000 - 50) + 50
print(pres)
```

> [!warning]
> 这个气压换算更适合理解垂直层设置，不等于某个网格点真实时刻的气压。复杂地形和实际气压场会让每个格点的层高发生变化。

如果需要每个格点、每一层的**真实气压**，不要用上面的 eta 公式，而应直接使用 WRF 输出中的全气压：

$$P_{full}=P+PB$$

其中 `P` 是扰动气压，`PB` 是基准态气压，两者相加即为该格点该层的真实气压（单位 Pa）：

```python
pres = ds["P"] + ds["PB"]   # 单位 Pa，除以 100 得 hPa
```

> [!warning]
> WRF v4 起默认启用混合垂直坐标（`hybrid_opt=2`），此时 eta 与气压**不再是**上面的线性关系，而是带混合权重 $B(\eta)$：低层贴合地形、高层趋于纯气压面。因此 $P=\eta\,(P_{bottom}-P_{top})+P_{top}$ 只在纯 sigma 坐标（`hybrid_opt=0`）或近地层近似成立。要真实气压请一律用 `P + PB`。

# 2. 位势高度：WRF 输出中的 PH 和 PHB

在气象学中，等压面上不同地点的高度通常不用普通几何高度，而用位势高度表示。

位势可以理解为单位质量空气在重力场中的势能，即把单位质量抬升到高度 $z$ 所做的功：

$$\Phi = \int_0^{z} g\,\mathrm{d}z \approx gz$$

位势高度为：

$$gpm=\frac{\Phi}{g}$$

在 WRF 输出中：

| 变量 | 含义 |
|---|---|
| `PHB` | Base-state Geopotential，基准态位势 |
| `PH` | Perturbation Geopotential，扰动态位势 |
| `PHB + PH` | 总位势，单位为 $m^2s^{-2}$ |

因此，位势高度可以写成：

$$gpm=\frac{PHB+PH}{g}$$

常用重力加速度：

```python
g = 9.81
```

> [!note]
> `PH` 和 `PHB` 位于 WRF 的垂直交错层上，层数通常比质量层多 1。若要得到质量层高度，通常需要对上下两个交错层取平均。

# 3. 海拔高度和离地高度

用位势米表示的位势高度与几何高度在低层几乎相同，一般后处理时可以近似认为二者相同。

> [!note]
> 二者的差异来自重力加速度 $g$ 随纬度和高度的变化，会随高度增大：近地面可忽略，但到平流层（10–20 km）可相差几十到上百米。若严格计算位势高度，应使用标准重力 $g_0=9.80665\ \mathrm{m/s^2}$。

如果要计算海拔高度，可以直接使用：

$$Height=\frac{PHB+PH}{g}$$

如果要计算离地高度，则还需要减去地形高度 `HGT`：

$$Z=\frac{PHB+PH}{g}-HGT$$

最常见的 Python 写法是：

```python
import xarray as xr

ds = xr.open_dataset("wrfout_d01_2020-07-01_00:00:00")

g = 9.81
z_stag = (ds["PHB"] + ds["PH"]) / g

# 垂直交错层转质量层
z_mass = 0.5 * (z_stag.isel(bottom_top_stag=slice(0, -1)).values +
                z_stag.isel(bottom_top_stag=slice(1, None)).values)

hgt = ds["HGT"].values
z_agl = z_mass - hgt[:, None, :, :]
```

可以顺手做个自检：最低交错层的 `(PHB+PH)/g` 应当基本等于 `HGT`，即离地高度 `z_agl` 最底层应接近 0。

> [!tip]
> 如果使用 `wrf-python`，可以直接用 `getvar(ncfile, "z")`（海拔高度）或 `getvar(ncfile, "height_agl")`（离地高度）获取高度变量；对应地，`getvar(ncfile, "pressure")` 可直接返回全气压（hPa），与上一节 `P + PB` 一致，适合快速分析。

# 4. 三类高度怎么选

| 任务 | 推荐使用 |
|---|---|
| 看 namelist 垂直层设置 | eta 层对应气压 |
| 画垂直剖面图 | 位势高度或离地高度 |
| 分析边界层内污染物 | 离地高度 |
| 对比探空或模式层高度 | 海拔高度 |
| 按 100 m、500 m、1000 m 分层统计 | 离地高度 |

# 总结

WRF 垂直高度最容易混淆的地方在于：eta 层、气压、位势高度和离地高度对应不同问题。

简单记：

- 看层设置：用 eta 到气压的关系。
- 看真实高度：用 `(PHB + PH) / g`。
- 看离地高度：再减去 `HGT`。

只要明确自己要分析的是“海拔高度”还是“离地高度”，后处理基本就不会走偏。

## 相关阅读

- [[python-cross-section|【Python】绘制任意线段的剖面图]]
- [[wrf-outfields|不重编译 WRF，如何用 outfields.txt 增减输出变量]]

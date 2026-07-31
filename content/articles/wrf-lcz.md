---
title: "WRF 中如何接入 LCZ"
description: "说明不同 WRF 版本接入 LCZ 城市下垫面的路径、分类差异与检查方法。"
date: 2026-07-04
collection: "大气模式与数据实操"
permalink: /wrf-lcz
tags:
  - WRF
  - LCZ
  - 城市气象
---
做城市气象模拟时，WRF 默认的城市下垫面分类通常不够细。传统的土地利用数据里，城市可能只是一个或几个类别；但在城市热岛、街谷通风、建筑能耗或 LES 模拟里，“城市”内部的差异往往才是重点。

LCZ（Local Climate Zone，本地气候区）就是为这个问题准备的。它把城市按形态和下垫面特征分成紧凑高层、开阔中层、稀疏建筑、重工业等类型，比简单的“城市用地”更适合接入 WRF 的城市冠层方案。

> [!summary]
> 现在最稳妥的做法是：用新版 WRF/WPS 的原生 LCZ 支持，优先走 WPS `geogrid` 的 `CGLC_MODIS_LCZ_global` 数据，不要一上来就用 [W2W](https://github.com/matthiasdemuzere/w2w) 改 `geo_em`。
>
> 对 WRF v4.5 之后的版本，核心检查项是：`LU_INDEX` 中 LCZ 城市类应为 `51-61`，`num_land_cat = 61`，并在 `namelist.input` 中打开 `use_wudapt_lcz = 1`。

# 最新版本优先

截至 2026-07，[WRF 最新发布版](https://github.com/wrf-model/WRF/releases)是 v4.8.0，[WPS 最新发布版](https://github.com/wrf-model/WPS/releases) 是 v4.6.0。对 LCZ 接入来说，它们仍沿用 WRF v4.5 之后的逻辑：LCZ 城市类编号是 `51-61`，而不是早期教程里常见的 `31-41`。

如果你现在新开一个实验，建议直接按这个版本逻辑来：

1. 用 WPS 的 LCZ 版 `GEOGRID.TBL`；
2. 下载并放好 `CGLC_MODIS_LCZ_global` 静态数据；
3. 在 `namelist.wps` 中把土地利用数据源指向 `cglc_modis_lcz+default`；
4. 跑完 `geogrid.exe` 后确认 `geo_em` 的 `NUM_LAND_CAT` 是 61；
5. 在 WRF 里设置 `num_land_cat = 61` 和 `use_wudapt_lcz = 1`。

## WPS 端处理

WPS 里通常这样处理：

```bash
cd /path/to/WPS
ln -sf geogrid/GEOGRID.TBL.ARW_LCZ geogrid/GEOGRID.TBL
```

`namelist.wps` 中的 `geog_data_res` 可以写成：

```fortran
&geogrid
 geog_data_res = 'cglc_modis_lcz+default',
                 'cglc_modis_lcz+default',
                 'cglc_modis_lcz+default',
/
```

域数按自己的嵌套层数补齐即可。跑完 `geogrid.exe` 后先别急着往后走，先查：

```bash
ncdump -h geo_em.d01.nc | grep -i num_land_cat
```

正常情况下应该能看到类似：

```text
:NUM_LAND_CAT = 61 ;
```

如果要更细一点，还可以看 `LU_INDEX` 里有没有 `51-61` 的城市格点。没有的话，要么研究区里确实没有城市，要么 LCZ 数据没有被 `geogrid` 正确读进去。

## WRF 端设置

WRF 端的关键设置在 `namelist.input` 的 `&physics`：

```fortran
&physics
 sf_surface_physics = 2, 2, 2,
 sf_urban_physics   = 2, 2, 2,
 num_land_cat       = 61,
 use_wudapt_lcz     = 1,
/
```

这里 `sf_surface_physics = 2` 是 Noah LSM；如果用 Noah-MP，也要确认相应表文件里的 LCZ 类别是一致的。`sf_urban_physics` 可以用：

| 取值 | 含义 | 备注 |
|---|---|---|
| `1` | SLUCM，单层城市冠层 | 普通中低分辨率城市模拟可用 |
| `2` | BEP，多层建筑环境参数化 | 高分辨率、复杂街谷更合适 |
| `3` | BEP+BEM，加入建筑能耗 | 需要考虑空调、建筑能耗时使用 |

如果是内层 LES，尤其第一层只有几米到几十米，我更建议用 `sf_urban_physics = 2` 或 `3`。SLUCM 要求最低模式层高于建筑相关高度，高层或紧凑城市里很容易在 `real.exe` 阶段报：

```text
ZDC + Z0C + 2m is larger than the 1st WRF level
```

这种情况不要硬调垂直层凑过去，先检查是不是该换 BEP / BEP+BEM。

> [!warning]
> `URBPARM_LCZ.TBL` 要在运行目录里，且要和当前 WRF 版本匹配。不要拿旧的 3 类城市 `URBPARM.TBL` 去配 LCZ，也不要把 WRF v4.3 时代的 41 类 `geo_em` 直接塞给 v4.5 之后的 WRF。

# 版本差异在哪里

WRF v4.5 之后做 LCZ，最容易踩的坑不是 `use_wudapt_lcz`，而是类别编号。

## v4.5 之后：从 41 类变成 61 类

早期 WRF-LCZ 教程、W2W 示例和很多旧笔记会让你设置：

```fortran
num_land_cat = 41
```

这是 WRF v4.3 那套做法。到了 v4.5 之后，LCZ 城市类变成：

| LCZ | WRF 土地利用编号 |
|---|---|
| LCZ 1 | 51 |
| LCZ 2 | 52 |
| LCZ 3 | 53 |
| LCZ 4 | 54 |
| LCZ 5 | 55 |
| LCZ 6 | 56 |
| LCZ 7 | 57 |
| LCZ 8 | 58 |
| LCZ 9 | 59 |
| LCZ 10 | 60 |
| LCZ E / Asphalt | 61 |

严格说，这个变化在 v4.4.2 附近就已经出现；但对很多人来说，是从 v4.5、v4.5.2 开始集中遇到的。原因也简单：`51-61` 可以避开 NLCD 40 类土地利用的编号冲突，而旧的 `31-41` 会和一些数据体系打架。

所以，WRF v4.5 之后要记住三件事：

- `num_land_cat` 用 `61`；
- `geo_em`、`met_em`、`wrfinput` 里的土地分类都要保持 61 类；
- `LU_INDEX` 的 LCZ 城市格点应该是 `51-61`，不是 `31-41`。

如果你用的是官方 `CGLC_MODIS_LCZ_global` 数据，`geogrid` 会把这套关系处理好。真正麻烦的是自制 LCZ 图，尤其是用 W2W 输出的结果。

W2W 的优点是可以把 LCZ Generator 或自己裁剪的 LCZ GeoTIFF 接进 WRF，并生成一些城市形态参数。这套工具也有对应的 [JOSS 论文](https://doi.org/10.21105/joss.04432)。但它的公开文档仍明确写着 `num_land_cat = 41`，并建议用于 WRF v4.3.x。也就是说，W2W 的默认产物更接近旧逻辑：`31-41`。

如果你把这样的 `geo_em` 直接拿去跑 WRF v4.5 之后的版本，常见结果是：

```text
too many input landuse types
LANDUSE OUTSIDE RANGE
```

这不是 `real.exe` 偶发抽风，而是土地利用类别体系不一致。

> [!tip]
> 如果没有强烈的城市定制图需求，优先用官方 CGLC-MODIS-LCZ 路径。只有在必须使用 LCZ Generator 城市定制图时，再考虑 W2W，并额外处理 `31-41` 到 `51-61` 的重映射。

这个重映射不是简单改一个全局属性。至少要同时处理：

- `LU_INDEX`：把城市类从 `31-41` 映射到 `51-61`；
- `LANDUSEF`：把 41 类维度扩展到 61 类，并把城市占比搬到正确位置；
- `NUM_LAND_CAT`：从 41 改成 61；
- 父域、子域、`met_em`、`wrfinput`：所有文件的类别数要一致。

只改 `NUM_LAND_CAT` 而不改 `LANDUSEF`，表面上可能能过一两步，后面仍然会在 `real.exe` 或 `wrf.exe` 里出问题。

## v4.3 到 v4.4：主线开始支持 LCZ

WRF v4.3 是一个重要分界点：从这个版本开始，WRF 主线已经可以原生识别 WUDAPT LCZ 城市土地利用类型。换句话说，v4.3 之前常见的“改 WRF 源码接 LCZ”不再是必选项。

这一阶段的典型做法是：

```fortran
&physics
 sf_surface_physics = 2,
 sf_urban_physics   = 2,
 num_land_cat       = 41,
 use_wudapt_lcz     = 1,
/
```

这里的 `41` 对应旧编号体系：LCZ 城市类通常放在 `31-41`。这也是为什么很多 W2W 教程会让你检查所有父域 `NUM_LAND_CAT` 是否为 41。

这个阶段，如果使用 W2W，流程大致是：

1. 先正常跑 WPS，得到各层嵌套的 `geo_em.d0*.nc`；
2. 准备覆盖目标内层区域的 LCZ GeoTIFF；
3. 用 W2W 指向最内层 `geo_em`；
4. 用 W2W 输出的 `geo_em.d0X_LCZ_params.nc` 或相关文件替换原 `geo_em`；
5. 重新跑 `metgrid.exe` 和 `real.exe`。

示例命令类似：

```bash
w2w /path/to/workdir lcz_epsg4326.tif geo_em.d04.nc -l 1
```

其中 `-l 1` 常用于 LCZ Generator 生成的图，因为它的第 1 个 band 通常是推荐使用的高质量 LCZ 分类。

W2W 跑完后会生成几类文件：去城市版、LCZ 范围版、LCZ 参数版等。一般接城市冠层参数时用 `*_LCZ_params.nc`。如果使用 BEP 或 BEM，还要留意 W2W 最后打印的 `nbui_max`，它和 WRF 编译期的 `num_urban_nbui` 有关。

这个阶段的逻辑比 v4.5 之后简单一些，因为 W2W 默认输出和 WRF v4.3 的 41 类体系是匹配的。它的麻烦在另一个地方：你仍然要确保所有嵌套域的 `NUM_LAND_CAT` 一致，且 `use_wudapt_lcz` 在所有 domain 上的开关一致。

## v4.3 之前：基本是补丁路线

WRF v4.3 之前没有现在这种主线内置的 LCZ 接口。那时要把 LCZ 接进 WRF，通常走的是 WUDAPT 早期方案：准备 LCZ 图，生成或替换 WRF 需要的城市参数，再配合修改过的 WRF 代码和表文件运行。

简单说，不是只改 `namelist.input` 就能完成。

早期流程一般包括：

- 把 LCZ 图转换到 WRF 网格；
- 把 LCZ 类别映射为 WRF 能识别的土地利用和城市类型；
- 修改或替换 `URBPARM.TBL`、`VEGPARM.TBL` 等表文件；
- 修改 WRF 物理初始化或城市冠层相关代码；
- 重新编译 WRF；
- 再跑 WPS、`real.exe` 和 `wrf.exe`。

这类方法现在不太建议新项目继续使用。不是说不能跑，而是可复现性和维护成本都比较差：换一个 WRF 小版本，补丁可能就不适用了；同一个实验给别人复现时，也很难说清到底改了哪些源码和表文件。

如果项目已经被历史版本锁死，比如前人用 WRF v3.x 做了一整套实验，需要严格复现实验设计，那可以继续沿用旧流程。但如果是新实验，最好直接升级到 v4.5 之后的版本，按 61 类 LCZ 体系重新整理。

# 检查与排错

接 LCZ 时，不要只看 `namelist.input`。很多错误其实在 `geo_em` 阶段就埋下了。

## 先检查类别数

我自己的检查顺序一般是：

```bash
ncdump -h geo_em.d01.nc   | grep -i NUM_LAND_CAT
ncdump -h met_em.d01*.nc  | grep -i NUM_LAND_CAT
ncdump -h wrfinput_d01    | grep -i NUM_LAND_CAT
```

如果是 WRF v4.5 之后，这三个地方都应该是 61。只要其中一个还是 41 或 21，就不要继续跑长时间模拟。

## 再检查表文件

还要检查运行目录里的表文件：

- `URBPARM_LCZ.TBL` 是否存在；
- `VEGPARM.TBL` 或 `MPTABLE.TBL` 是否包含 `LCZ_1` 到 `LCZ_11`；
- 表文件里的 LCZ 编号是否和 `LU_INDEX` 一致；
- 是否误用了别的 WRF 版本目录里的表文件。

## 常见报错

如果遇到下面这些报错，可以先按这个方向排：

| 报错或现象 | 常见原因 | 处理 |
|---|---|---|
| `LANDUSE OUTSIDE RANGE` | 41 类和 61 类混用 | 统一 `geo_em`、`met_em`、`wrfinput` 的土地分类体系 |
| `too many input landuse types` | W2W 旧产物直接用于新版 WRF | 改用官方 LCZ 数据，或完整重映射到 61 类 |
| `USING 10 WUDAPT LCZ WITHOUT URBPARM_LCZ.TBL` | 开了 LCZ 但缺参数表 | 把匹配版本的 `URBPARM_LCZ.TBL` 放到运行目录 |
| `USING URBPARM_LCZ.TBL WITH OLD 3 URBAN CLASSES` | `use_wudapt_lcz` 与输入数据不一致，也可能是域内 LCZ 类型太少触发误判 | 先查 `LU_INDEX`，再决定是关 LCZ、补城市数据，还是换覆盖更完整的数据 |
| `ZDC + Z0C + 2m is larger than the 1st WRF level` | SLUCM 与低模式层、高建筑冲突 | 高分辨率城市模拟改用 BEP / BEP+BEM |

> [!note]
> 大范围粗分辨率父域里，有时城市格点很少，甚至没有足够多的 LCZ 类型。WRF 里曾经有过用 `UTYPE_URB2D` 最大值判断 LCZ 是否启用的逻辑问题，可能在城市类型较少时误判；这个问题在 [WRF issue #1878](https://github.com/wrf-model/WRF/issues/1878) 中有讨论。遇到相关报错时，不要只盯着 namelist，最好直接看 `LU_INDEX` 和 `UTYPE_URB2D`。

# 最后怎么选

最后把版本关系压成一句话：

| WRF 版本 | LCZ 接入方式 | 土地分类编号 |
|---|---|---|
| v4.3 之前 | 需要手动改代码、表文件和预处理流程 | 取决于补丁方案 |
| v4.3 到 v4.4 | 主线开始支持 `use_wudapt_lcz`，W2W 路线较常见 | 通常是 `31-41`，`num_land_cat = 41` |
| v4.5 之后 | 优先用 WPS 原生 LCZ 静态数据和新版表文件 | `51-61`，`num_land_cat = 61` |

如果只是想把实验稳定跑起来，建议按新版逻辑做：官方 LCZ 静态数据、`GEOGRID.TBL.ARW_LCZ`、`num_land_cat = 61`、`use_wudapt_lcz = 1`。等这条线跑通之后，再考虑是否需要用 LCZ Generator 和 W2W 做城市定制图。

## 相关阅读

- [[wrf-outfields|不重编译 WRF，如何用 outfields.txt 增减输出变量]]
- [[wrf-vertical-coordinates|WRF｜垂直高度的换算]]
- [[python-wrf-domain|【Python】设计与绘制WRF网格]]

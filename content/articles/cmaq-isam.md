---
title: "CMAQ-ISAM ：从 EmissCtrl 到 GRIDMASK"
description: "梳理 CMAQ-ISAM 从 EmissCtrl、GRIDMASK 到追踪标签和运行脚本的完整配置关系。"
date: 2026-06-25
collection: "大气模式与数据实操"
permalink: /cmaq-isam
tags:
  - CMAQ
  - ISAM
  - 源解析
---
CMAQ-ISAM 是 CMAQ 中常用的源解析工具，可以追踪不同区域、不同部门或不同排放流对污染物浓度的贡献。

这篇记录一次使用 ISAM 的基本配置逻辑，重点放在几个关键文件：`EmissCtrl.nml`、`GRIDMASK.nc`、`isam_control.txt` 和 `run_cctm.csh`。

> [!summary]
> ISAM 配置可以理解成三个问题：
>
> 1. 追踪哪些区域？
> 2. 追踪哪些排放流？
> 3. 输出哪些物种的贡献？

> [!note] 2026 更新
> 这篇原文基于我当时使用的 CMAQ/ISAM 配置习惯整理，核心逻辑仍然适用：区域、排放流、物种标签要互相对上。但从 CMAQv5.5 文档和示例来看，区域注册更推荐放到 DESID 相关配置中，例如 `CMAQ_Control_DESID.nml` 的 `&Desid_RegionDef`，而不是只看旧版的 `EmissCtrl_${MECH}.nml` / `RegionsRegistry` 写法。
>
> 如果你使用的是 CMAQv5.5 或更新版本，建议同时对照官方 ISAM 教程和用户指南确认文件名、变量名和脚本变量。[^1]

# 1. EmissCtrl.nml：注册追踪区域

进入 CCTM 编译目录，例如：

```bash
cd CCTM/scripts/BLD_CCTM_v533_ISAM_intel
vi EmissCtrl_${MECH}.nml
```

在 `RegionsRegistry` 中设置区域标签：

```fortran
&RegionsRegistry
    RGN_NML =
    ! | Region Label | File_Label    | Variable on File
      'ALL'          , 'ISAM_REGIONS', 'ALL',
/
```

字段含义：

| 字段 | 含义 |
|---|---|
| `Region Label` | 追踪区域标签 |
| `File_Label` | 区域定义文件标签，一般由 `run_cctm.csh` 指向 |
| `Variable on File` | 区域文件中的变量名，常用 `ALL` |

> [!note]
> 区域文件中可以有暂时不用的变量，但变量值必须在 0-1 范围内。

> [!tip] v5.5 补充：DESID 区域定义
> 在 CMAQv5.5 的 ISAM benchmark 教程中，区域文件注册示例放在 `CMAQ_Control_DESID.nml` 里，通过 `&Desid_RegionDef` 指定 `Region Label`、`File_Label` 和 `Variable on File`。它和上面这段旧写法解决的是同一个问题：告诉 CMAQ 区域标签对应哪个区域文件、哪个变量。
>
> 因此实际配置时可以这样理解：旧项目里如果看到 `EmissCtrl_${MECH}.nml` / `RegionsRegistry`，就按原项目结构处理；新版本或官方 benchmark 流程里如果看到 `CMAQ_Control_DESID.nml` / `&Desid_RegionDef`，就优先按新文档来。

# 2. GRIDMASK.nc：定义区域范围

`GRIDMASK.nc` 是 ISAM 区域追踪的核心文件。它告诉 CMAQ 哪些网格属于某个区域。

> [!warning]
> `GRIDMASK.nc` 不是普通 NetCDF 文件就可以。它必须符合 I/O API 文件结构，否则 CMAQ 可能读不到变量或识别不了维度。

常见制作方式有三种。

## 方法一：改写 GRIDCRO2D

思路是直接利用 MCIP 生成的 `GRIDCRO2D` 文件，因为它本来就是符合 I/O API 的网格文件。

大致步骤：

1. 复制一份 `GRIDCRO2D`；
2. 修改变量名为需要的追踪区域名称；
3. 根据 shp 或经纬度范围，把区域内网格设为 1，区域外设为 0；
4. 更新全局属性中的 `VAR-LIST`；
5. 保留 `TSTEP`，且时间维只保留 1。

> [!caution]
> `VAR-LIST` 中每个变量名需要占 16 个字符，不足的部分用空格补齐。这是很多人生成 GRIDMASK 后模式读不到变量的原因。

> [!note] mask 值不一定只能是 0 或 1
> 对规则区域，直接用 0/1 表示“区域外/区域内”通常够用。但在官方 DESID 区域定义说明中，区域变量也可以表示网格被某个区域覆盖的比例，取值范围是 `0.0-1.0`。如果区域边界来自 shapefile，边界格点可能更适合保留面积占比，而不是强行二值化。
>
> CMAQv5.5 发布说明还提到新增了 `shp2cmaq`，可用于把 shapefile 转成 CMAQ gridded mask 文件。已有 Python/M3Tools 流程可以继续用，但新项目也可以评估这个工具是否更省事。[^2]

## 方法二：M3Tools

CMAQ/I/O API 自带的 M3Tools 提供了更规范的方式：

| 工具 | 用途 |
|---|---|
| `M3MASK` | 根据 ASCII/CSV 生成单个 mask 文件 |
| `M3MERGE` | 合并多个 mask 文件 |
| `ncap2` | 必要时转换变量类型 |

典型流程：

1. 用 Python 根据 shp 计算区域 mask，并输出 ASCII/CSV；
2. 用 `M3MASK` 生成单变量 I/O API 文件；
3. 多区域时用 `M3MERGE` 合并；
4. 如果变量类型是 int，再用 `ncap2` 转成 float/real。

## 方法三：Spatial Allocator

Spatial Allocator 也可以制作符合 I/O API 的区域文件，适合已有 SA 工作流的情况。

# 3. isam_control.txt：定义追踪标签

进入脚本目录：

```bash
cd CCTM/scripts
vi isam_control.txt
```

示例：

```txt
TAG CLASSES     |OZONE, PM25_IONs

TAG NAME        |AQP
REGION(S)       |Anqing
EMIS STREAM(S)  |MEIC_POW
```

字段含义：

| 字段 | 含义 |
|---|---|
| `TAG CLASSES` | 追踪物种类别 |
| `TAG NAME` | 自定义标签，通常不超过 3 个字符 |
| `REGION(S)` | 追踪区域，对应 `GRIDMASK.nc` 中的区域 |
| `EMIS STREAM(S)` | 追踪排放流，对应 `run_cctm.csh` 中的排放标签 |

> [!tip]
> 如果要追踪不同部门来源，需要先把人为源排放拆成多个排放流，例如 `MEIC_POW`、`MEIC_IND`、`MEIC_TRA` 等。

> [!note] 物种类别也要看版本和机制
> `TAG CLASSES` 可用哪些类别，和 CMAQ 版本、气溶胶方案、化学机制有关。CMAQv5.5 和后续 bugfix 分支对 ISAM 的 SOA、粗粒子、云过程、CRACMM2 相关处理都有过更新。如果要追踪 SOA、NOy、VOC 或 CRACMM2 下的贡献，建议先查当前版本的 ISAM species list 和 release/bugfix 说明。[^3]

# 4. run_cctm.csh：打开 ISAM 并指向文件

在 `run_cctm.csh` 中需要确认：

```bash
setenv CTM_ISAM Y
setenv AISAM_BLEV_ELEV " 1 26"
setenv ISAM_REGIONS $INPDIR/GRIDMASK.nc
```

同时检查排放流标签，例如：

```bash
setenv GR_EMIS_LAB_001 MEIC_POW
setenv GR_EMIS_LAB_002 MEIC_IND
setenv GR_EMIS_LAB_003 MEIC_RES
```

这些标签要和 `isam_control.txt` 中的 `EMIS STREAM(S)` 保持一致。

> [!tip] v5.5 补充：还要检查 SA_IOLIST 和 ISAM 文件变量
> 在较新的 ISAM 运行脚本里，除了 `CTM_ISAM`、`AISAM_BLEV_ELEV` 和 `ISAM_REGIONS`，通常还会显式设置 `SA_IOLIST`，让 CCTM 找到 `isam_control.txt`：
>
> ```bash
> setenv SA_IOLIST $INPDIR/isam_control.txt
> ```
>
> 同时注意 `ISAM_NEW_START`、`ISAM_PREVDAY` 以及 `SA_ACONC_1`、`SA_CONC_1`、`SA_DD_1`、`SA_WD_1`、`SA_CGRID_1` 等输出或重启相关变量。不同版本的 benchmark 脚本名字和路径会有差别，但排查时不要只盯着 `ISAM_REGIONS`，否则容易出现控制文件或前一天重启文件没有正确接上的问题。

# 5. 常见报错：Maximum number of files

如果追踪标签太多，可能遇到：

```txt
Could not open SA_CONC_1
Maximum number of files already have been opened.
```

这通常和 I/O API 版本限制有关。旧版本同时打开文件数上限较低，标签过多时会触发问题。

解决思路：

| 方法 | 说明 |
|---|---|
| 减少追踪标签 | 最直接，但会牺牲分析维度 |
| 升级 I/O API | 推荐使用支持更多打开文件数的新版本 |
| 重新编译 CCTM 和 MCIP | 保证 I/O API 版本一致 |

> [!warning]
> 只重新编译 CCTM 不一定够。如果 MCIP 和 CCTM 使用的 I/O API 版本不一致，可能出现变量单位或文件兼容性问题。

> [!note] 新版本仍建议留意 I/O API 和 ISAM 修正
> CMAQv5.5 之后的 bugfix 分支仍在修正少量 ISAM 相关问题，例如特定机制下的 post-processing、aerosol/cloud processing 和 species list。正式生产实验最好固定 CMAQ、MCIP、I/O API 版本，并在方法部分记录 commit 或 release tag，避免后续复现实验时出现“同样配置、不同版本”的差异。

# 总结

CMAQ-ISAM 的配置核心是让四类信息互相对上：

| 文件 | 作用 | 必须对应 |
|---|---|---|
| `EmissCtrl.nml` | 注册区域文件和区域标签 | `GRIDMASK.nc` |
| `GRIDMASK.nc` | 定义区域空间范围 | `Region Label` |
| `isam_control.txt` | 设置追踪标签 | 区域名和排放流 |
| `run_cctm.csh` | 打开 ISAM、指定路径和排放流 | `ISAM_REGIONS`、`GR_EMIS_LAB` |

> [!tip] 对新版本可以这样扩展这张表
> 如果使用 CMAQv5.5 或更新版本，可以把 `CMAQ_Control_DESID.nml` / `&Desid_RegionDef` 也放进检查清单；把 `SA_IOLIST` 和 `SA_*` 输出/重启文件变量也加入 `run_cctm.csh` 检查项。这样既保留旧项目的配置思路，也能和新版本官方示例对上。

第一次配置时不要一口气追踪太多区域和部门。建议先做一个最小测试：一个区域、一个排放流、一个物种类别。跑通后再扩展到完整方案。

[^1]: <https://github.com/USEPA/CMAQ/blob/main/DOCS/Users_Guide/Tutorials/CMAQ_UG_tutorial_ISAM.md>、<https://raw.githubusercontent.com/USEPA/CMAQ/main/DOCS/Users_Guide/CMAQ_UG_ch11_ISAM.md>
[^2]: <https://github.com/USEPA/CMAQ>
[^3]: <https://github.com/USEPA/CMAQ/wiki/CMAQ-Bugfix-Branch>

## 相关阅读

- [[python-wrf-cmaq-domain-map|【Python】绘制WRF-CMAQ模拟研究区域]]
- [[jiangsu-ozone-diagnosis|文献精读｜如何诊断江苏臭氧污染过程]]
- [[lpdm-psc|利用后向足迹计算潜在源贡献]]

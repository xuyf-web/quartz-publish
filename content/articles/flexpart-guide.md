---
title: "FLEXPART 从编译到运行"
description: "区分标准 FLEXPART 11 与 FLEXPART-WRF，梳理编译、气象输入、运行配置和结果检查。"
date: 2026-07-18
collection: "大气模式与数据实操"
permalink: /flexpart-guide
tags:
  - FLEXPART
  - 拉格朗日粒子模型
  - 大气输送
---
后向轨迹能告诉我们气团大致从哪里来，但当问题进一步变成“某个区域对观测点的潜在贡献有多大”“沉降、湍流和对流会怎样改变输送”时，单条轨迹往往就不够了。FLEXPART 把气团表示为大量计算粒子，可以在同一套框架中处理输送、湍流扩散、干湿沉降和衰变，也能做前向与后向模拟。

这篇文章重点放在两条常见路线：由 ECMWF/GFS 气象场驱动的标准 FLEXPART 11，以及直接读取 `wrfout` 的 FLEXPART-WRF。命令本身不算多，真正容易出问题的是版本、气象输入、时间范围和物理选项没有互相对上。

> [!summary]
> 标准 FLEXPART 11 与 FLEXPART-WRF 是两套相关但不同的程序。前者当前主要读取 ECMWF 和 NCEP/GFS 气象场，配置由 `COMMAND`、`RELEASES`、`OUTGRID`、`pathnames` 和 `AVAILABLE` 等文件组成；后者直接读取 WRF NetCDF 输出，主要通过一个 `flexwrf.input` 设置运行。
>
> 第一次操作时，建议先完成一个短时段、单释放点、较少粒子的最小算例。确认时间、位置和输出量都正确后，再扩展空间范围与粒子数。

# 先弄清 FLEXPART 在算什么

[FLEXPART ](https://www.flexpart.eu/index.html) 是拉格朗日粒子输送与扩散模型。除了平流和湍流扩散，它还能描述干湿沉降、衰变与线性化学过程，计算尺度可以从局地延伸到全球。

![[FLEXPART 从编译到运行-20260714.png]]

它和常见的气团轨迹分析有一点关键差别。轨迹通常跟随一条或若干条理想化空气质点路径，FLEXPART 会释放大量粒子，并对次网格湍流等随机过程采样。因此，后向模拟的典型结果也不只是几条线，而是接收点对上游网格排放的敏感度或粒子停留时间分布。

前向与后向模式分别适合不同的问题：

| 模式 | 典型问题 | 常见输出 |
|---|---|---|
| 前向模拟 | 一个排放源会影响哪里 | 浓度、混合比、沉降和粒子位置 |
| 后向模拟 | 到达观测点的空气可能受哪些区域影响 | 停留时间、源—受体关系和排放敏感度 |

这里还需要选对程序。

| 气象输入 | 建议使用 | 说明 |
|---|---|---|
| ECMWF/ERA5 | FLEXPART 11 `FLEXPART_ETA` | 使用 ECMWF 模式层和 eta 坐标数据 |
| NCEP/GFS | FLEXPART 11 `FLEXPART` | 编译时使用 `eta=no` |
| WRF 输出 | FLEXPART-WRF | 直接读取 NetCDF 格式的 `wrfout` |

截至本文整理时，官网列出的标准版主线是 FLEXPART 11；WRF 驱动版本在官网的 [FLEXPART family](https://www.flexpart.eu/family.html) 中单独维护。两者的配置文件、编译方式和部分开关取值都不同，不能把一套教程里的参数直接搬到另一套程序中。

以下是一次模拟的绘图结果示例

![[FLEXPART 从编译到运行-20260718.png]]

# 标准 FLEXPART 11 的运行流程

## 下载与依赖

官方代码仓库可以直接克隆：

```bash
git clone --single-branch --branch master \
  https://gitlab.phaidra.org/flexpart/flexpart.git
cd flexpart
```

根据 [FLEXPART 11 编译文档](https://flexpart.img.univie.ac.at/docs/building.html)，当前代码使用 Fortran 2018，可用 GNU Fortran 8 及以上版本或 Intel `ifort` 编译，核心依赖是 ecCodes 与 NetCDF Fortran。如果没有在默认路径，可以在单独的环境脚本中设置编译器和库路径：

```bash
export FC=ifort
export CC=icc
export CXX=icpc

export CPATH=/path/to/eccodes/include:/path/to/netcdf/include:${CPATH}
export LIBRARY_PATH=/path/to/eccodes/lib:/path/to/netcdf/lib:${LIBRARY_PATH}
```

路径要替换成服务器上的实际位置，可以用 `nf-config --all`、`nc-config --all` 和 `pkg-config --libs eccodes` 检查。

## 编译可执行程序

进入源码目录后选择对应的 Makefile：

```bash
cd src
make -j -f makefile_intel
```

默认会得到 `FLEXPART_ETA`。官方文档明确说明，这个可执行程序只用于 ECMWF 数据。

如果输入是 NCEP/GFS，需要关闭 eta 坐标：

```bash
make -j -f makefile_intel eta=no
```

编译结果为 `FLEXPART`。使用 GNU 编译器时，把 `makefile_intel` 换成仓库中对应的 GNU Makefile，具体文件名以当前版本源码为准。

> [!important]
> `FLEXPART_ETA` 和 `FLEXPART` 的差别由气象场垂直坐标决定，并不是可以随意互换的两个文件名。输入数据来自 ERA5，也不代表普通的压力层 ERA5 文件可以直接运行 FLEXPART；模型需要完整且格式正确的气象变量。

## 准备气象场

标准 FLEXPART 11 当前支持 ECMWF IFS 与 NCEP GFS 两类输入。ECMWF 数据通常通过 [flex_extract](https://flexpart.img.univie.ac.at/flexextract/index.html) 提取和预处理。它负责组织 FLEXPART 所需的三维风、温度、湿度、云水，以及地面气压、降水、热通量和地形等字段。

`flex_extract` 的访问方式会受 ECMWF 账户权限、数据集和 API 变化影响。尤其是 ERA5 模式层数据，不能只照搬一个普通 CDS 压力层下载脚本。正式下载前应先检查 [flex_extract 安装与数据权限说明](https://flexpart.img.univie.ac.at/flexextract/installation.html)，再用小区域、短时段测试凭据和 CONTROL 文件。

气象文件准备好后，还需要一个 `AVAILABLE` 文件。它记录每个气象时次及其文件名，让 FLEXPART 知道该读取哪些文件。

## 组织运行目录

一个便于复现的目录可以这样放：

```text
case_demo/
├── options/
│   ├── COMMAND
│   ├── RELEASES
│   ├── OUTGRID
│   ├── AGECLASSES
│   └── SPECIES/
├── met/
│   ├── AVAILABLE
│   └── ...
├── output/
├── pathnames
└── run.sh
```

[FLEXPART 11 配置文档](https://flexpart.img.univie.ac.at/docs/configuration.html) 把运行输入分成三组：描述实验的 option 文件、集中记录路径的 `pathnames`，以及列出气象文件的 `AVAILABLE`。

`pathnames` 最基本的四行分别是 option 目录、输出目录、气象数据目录和 `AVAILABLE` 的完整路径：

```text
/project/case_demo/options/
/project/case_demo/output/
/project/case_demo/met/
/project/case_demo/met/AVAILABLE
```

如果使用嵌套气象场，可以继续按“气象目录 + AVAILABLE 文件”成对增加。

## 配置一次最小模拟

FLEXPART 11 仓库的 `options/` 中带有模板，建议复制模板再改，不要从空文件开始写。几个核心文件分别回答不同问题：

| 文件 | 主要内容 |
|---|---|
| `COMMAND` | 模拟起止时间、前向/后向、输出间隔、物理过程开关 |
| `RELEASES` | 释放或接收区域、时间、高度、粒子数和物种 |
| `OUTGRID` | 输出网格范围、水平分辨率与垂直层 |
| `SPECIES_nnn` | 示踪物的衰变、沉降和化学属性 |
| `AGECLASSES` | 粒子年龄分组及最大追踪时间 |

在 `COMMAND` 中，`LDIRECT=1` 表示前向，`LDIRECT=-1` 表示后向。一个容易混淆的地方是：即使进行后向模拟，`IBDATE/IBTIME` 仍然填写较早时刻，`IEDATE/IETIME` 填写较晚时刻。模型会根据 `LDIRECT` 决定积分方向。

下面只保留需要优先确认的字段，实际文件应从当前版本模板复制：

```fortran
&COMMAND
  LDIRECT = -1,  					! Simulation direction in time   ; 1 (forward) or -1 (backward)
  IBDATE  = 20260701,		! Start date
  IBTIME  = 000000,			! Start time
  IEDATE  = 20260703,		! End date
  IETIME  = 000000,			! End time
  LOUTSTEP   = 10800,		! Interval of model output; average concentrations calculated every LOUTSTEP (s)
  LOUTAVER   = 10800,		! Interval of output averaging (s)
  LOUTSAMPLE = 900,		! Interval of output sampling  (s), higher stat. accuracy with shorter intervals
  LSYNCTIME  = 900,			! All processes are synchronized to this time interval (s)
  IOUT = 9,							! Gridded output type: [0]off [1]mass [2]pptv [3]1&2 [4]plume [5]1&4, +8 for NetCDF output
  IPOUT = 0,						! Particle position output: [0]off [1]every output [2]only at end
  LCONVECTION = 1,			! Switch for convection parameterization;[0]off [1]on
  LTURBULENCE = 1,			! Switch for turbulence parameterisation;[0]off [1]on
/
```

`IOUT=9` 可以理解为在 `IOUT=1` 的基础上选择 NetCDF 网格输出。后向模式下，它会生成接收点对上游排放的敏感度，而前向模式下对应质量浓度。是否开启粒子级输出由 `IPOUT` 控制；粒子很多时，`partoutput` 会迅速膨胀，第一次测试可以先关闭。

`RELEASES` 定义粒子从什么时间、什么位置和高度进入模拟。后向计算中，这里的释放区域实际代表接收区域。高度还必须配合 `ZKIND` 解读：`1` 是离地高度，`2` 是海拔高度，`3` 是 hPa 气压。

> [!warning]
> 经纬度、UTC 时间和高度基准是最常见的静默错误。程序可能正常结束，但结果已经偏离原本的问题。经纬度框不要直接拿投影坐标填写，站点的本地时间也要先换成 UTC。

`OUTGRID` 决定结果被统计到什么网格。拉格朗日模型的输出网格可以和气象网格不同，但必须位于计算域内。分辨率设得比气象场精细很多，并不会凭空增加输送信息，只会增加随机噪声、文件体积和计算开销。

## 启动计算

FLEXPART 11 使用 OpenMP 编译时，官方建议先放开线程栈，并绑定 CPU 核：

```bash
mkdir -p /project/case_demo/output
test -w /project/case_demo/output

ulimit -s unlimited
export OMP_NUM_THREADS=8
export OMP_PLACES=cores
export OMP_PROC_BIND=true

./FLEXPART_ETA /project/case_demo/pathnames > run.log 2>&1
```

GFS 路线把最后一行的程序换成 `FLEXPART`。根据 [官方运行文档](https://flexpart.img.univie.ac.at/docs/running.html)，返回码 `0` 才表示成功结束；因此批处理脚本里不要只检查输出文件是否出现，还要保存退出状态。

# FLEXPART-WRF 的运行流程

标准版不能直接把 `wrfout_d01_*` 当作输入。需要区域高分辨率气象场时，应使用 [FLEXPART-WRF 代码仓库](https://git.nilu.no/flexpart/flexpart-wrf)。这条路线以 NetCDF 方式读取 WRF 输出，适合已经完成 WRF 模拟、希望在同一气象场上继续做扩散或源区分析的任务。

## 编译 FLEXPART-WRF

解压源码后先修改 `makefile.mom` 中的 NetCDF 路径和编译器：

```makefile
NETCDF = /path/to/netcdf/lib
COMPILER = intel
```

随后载入编译环境并执行：

```bash
make -f makefile.mom serial
```

Intel 环境中生成的程序名是 `flexwrf33_intel_serial`。不同分支、编译器和并行选项会改变文件名，以实际编译输出为准。FLEXPART-WRF 的运行支持和版本更新慢于标准 FLEXPART 11，正式实验最好把源码 release、commit、编译器和 NetCDF 版本一起记录下来。

## 生成 WRF 文件清单

把需要的 `wrfout` 放到统一目录，再生成 `AVAILABLE`。下面的脚本适合常见的 `wrfout_d01_YYYY-MM-DD_HH:MM:SS` 文件名：

```bash
#!/usr/bin/env bash
set -euo pipefail

WRFOUT_DIR="/project/flexpart-wrf/wrfouts"
AVAILABLE_FILE="${WRFOUT_DIR}/AVAILABLE"

{
  echo "XXXXXX EMPTY LINES XXXXXXXXX"
  echo "XXXXXX EMPTY LINES XXXXXXXX"
  echo "YYYYMMDD HHMMSS   name of the file(up to 80 characters)"
} > "${AVAILABLE_FILE}"

find "${WRFOUT_DIR}" -maxdepth 1 -type f -name 'wrfout_d0*' \
  | sort \
  | while IFS= read -r file; do
      filename=$(basename "${file}")
      if [[ ${filename} =~ wrfout_d.._([0-9]{4})-([0-9]{2})-([0-9]{2})_([0-9]{2}):([0-9]{2}):([0-9]{2})$ ]]; then
        printf "%s%s%s %s%s%s      '%s'      ' '\n" \
          "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}" "${BASH_REMATCH[3]}" \
          "${BASH_REMATCH[4]}" "${BASH_REMATCH[5]}" "${BASH_REMATCH[6]}" \
          "${filename}" >> "${AVAILABLE_FILE}"
      fi
    done
```

生成后应类似：

```text
XXXXXX EMPTY LINES XXXXXXXXX
XXXXXX EMPTY LINES XXXXXXXX
YYYYMMDD HHMMSS   name of the file(up to 80 characters)
20260701 000000      'wrfout_d01_2026-07-01_00:00:00'      ' '
20260701 010000      'wrfout_d01_2026-07-01_01:00:00'      ' '
```

先用 `head` 和 `tail` 检查首尾时间，再确认相邻文件间隔是否连续。文件缺时次、命名不统一或 `AVAILABLE` 排序错误，都可能让模型读到一半才退出。

## 修改 flexwrf.input

FLEXPART-WRF 3.3.x 把路径、时间、输出、年龄类别、释放信息和网格等内容集中在 `flexwrf.input`。第一次修改时，可以按下面顺序检查：

| 参数组 | 需要确认的内容 |
|---|---|
| 路径 | 输出目录、WRF 文件目录、`AVAILABLE` 位置 |
| 时间 | `LDIRECT`、起止时间、输出与采样间隔 |
| 释放 | 经度、纬度、释放高度、粒子数和释放时段 |
| 输出网格 | 范围、分辨率、垂直层与坐标类型 |
| 输出格式 | `IOUT`、`IOUTTYPE`、每个 NetCDF 文件的时间记录数 |
| 物理过程 | `TURB_OPTION`、`LCONVECTION`、`SFC_OPTION`、CBL 与风场选项 |

[FLEXPART-WRF 模型论文](https://doi.org/10.5194/gmd-6-1889-2013)介绍了该分支针对 WRF 气象场增加的湍流、并行计算和 NetCDF 输出等能力。其中 `TURB_OPTION=1` 使用标准 FLEXPART 的 Hanna 参数化；`2` 和 `3` 会用到 WRF 提供的 TKE 信息。选择后两项前，要先确认当前 WRF 物理方案确实输出了程序所需的 TKE 变量，变量名、维度和时间范围也能被当前 FLEXPART-WRF 版本识别。

可以先检查一个代表性文件的头信息：

```bash
ncdump -h wrfout_d01_2026-07-01_00:00:00 \
  | rg 'TKE|PBLH|HFX|UST|PH|PHB|P|PB'
```

这条命令只确认变量是否存在。变量值是否合理、是否覆盖全部时次，还要继续抽样检查。

对流开关也需要和 WRF 设置一起看。如果 WRF 使用了对流参数化，FLEXPART-WRF 中通常也要考虑相应的次网格对流；高分辨率显式对流算例则要重新判断。这里没有一个只按水平分辨率就能机械决定的通用值。

> [!warning]
> FLEXPART 11 文档中的 `LCONVECTION=0/1` 与某些 FLEXPART-WRF 3.3.x 输入文件里的 `0/3` 不是同一套取值约定。必须阅读手中源码附带的 `flexwrf.input` 注释，不能跨版本复制数字。

## 运行 FLEXPART-WRF

串行版本可以这样启动：

```bash
./flexwrf33_intel_serial flexwrf.input > run.log 2>&1
```

运行后先搜索日志中的错误和警告：

```bash
rg -n -i 'error|warning|failure|outside|missing|bad' run.log
```

服务器没有 `rg` 时再用 `grep -Eni`。如果程序在短测试中能够读完所有 WRF 时次、释放粒子并写出结果，再提交完整时段。

# 结果检查与常见问题

标准 FLEXPART 11 的 NetCDF 前向网格结果常见为 `grid_conc_*.nc`，后向结果常见为 `grid_time_*.nc`；粒子级输出写入 `partoutput_*.nc`。完整命名和开关对应关系可以查 [官方输出说明](https://flexpart.img.univie.ac.at/docs/output.html)。

![[FLEXPART 从编译到运行-20260714-1.png]]

拿到第一个输出文件后，可以先看维度、坐标、变量名和单位：

```bash
ncdump -h output/grid_time_20260701000000.nc | less
```

实际文件名由运行时段和输出设置决定。这里的目标是先确认经纬度范围、垂直层、释放维和时间维，再进入 Python、NCL 或其他后处理脚本。

后向结果尤其容易被误画成“轨迹频次”。`grid_time` 更接近源—受体敏感度或停留时间，需要结合输出单位、释放质量、网格体积和排放清单解释。不同设置下的数值不能只看颜色深浅直接比较。

## 一启动就 segmentation fault

如果标准 FLEXPART 11 使用 OpenMP 编译，先确认运行脚本中已经设置：

```bash
ulimit -s unlimited
```

这是 [官方故障排查文档](https://flexpart.img.univie.ac.at/docs/troubleshooting.html) 列出的首要检查项。随后再检查线程数、数组上限、气象文件是否损坏，以及运行时链接到的 ecCodes/NetCDF 是否和编译阶段一致。

## 输出网格超出 WRF 计算域

这类报错通常来自 `flexwrf.input` 中输出网格的左下角、范围、分辨率或坐标类型设置错误。不要只比较经纬度数字，还要确认 `OUTGRID_COORD` 使用的是规则经纬度还是 WRF 投影坐标。

一个稳妥做法是先把输出域缩到 WRF 域内部，跑通后再逐步扩展。边界刚好重合也可能受到投影和浮点误差影响，最好留出少量缓冲。

## `too much x and y grid. modify convmix_kfeta.f`

在我的运行记录中，这个错误在 FLEXPART-WRF 使用 `LCONVECTION=3` 时出现，内部 `maxval(igrid)` 达到异常大的量级；临时把对流开关设为 `0` 后，程序能够绕过报错。

> [!warning]
> 关闭对流会改变垂直输送物理，只适合确认错误是否来自对流模块。生产模拟不能因为“能跑完”就直接沿用。还应检查 WRF 网格尺寸、投影、对流方案、输入变量和 FLEXPART-WRF 版本，必要时构造短算例定位 `convmix_kfeta.f` 中的越界来源。

## `richardson not working -- bad h`

另一次运行中，程序在某个网格点算出负的层厚 `h`，推测和垂直气压或高度没有保持合理单调性有关。曾经通过在 `richardson.f90` 中把 `h<0` 的值强制改为 `10` 让算例完成，并在日志中记录到 22 次触发。这个改动仅作为诊断补丁。它会改变稳定度和湍流计算，不建议作为通用修复。

# 总结

FLEXPART 的基本运行链条可以压缩成六步：选对程序版本，编译依赖，准备气象场，生成 `AVAILABLE`，配置释放与输出，最后用日志和物理常识共同检查结果。

标准 FLEXPART 11 适合 ECMWF 和 GFS 数据，当前配置已经拆分为 `COMMAND`、`RELEASES`、`OUTGRID` 等 option 文件；FLEXPART-WRF 则直接读取 `wrfout`，运行设置主要集中在 `flexwrf.input`。把这两条路线分开之后，很多看似复杂的报错会清楚不少。

如果后面还要批量做多个站点或多个时次的后向模拟，我建议把“生成 RELEASES、检查 AVAILABLE、提交任务、扫描日志、整理 NetCDF”写成脚本，并把每次实验的版本与配置一起归档。FLEXPART 本身只是整条分析流程的一部分，可复现性更多取决于这些容易被忽略的文件。

## 相关阅读

- [[lpdm-psc|利用后向足迹计算潜在源贡献]]
- [[wrf-lcz|WRF 中如何接入 LCZ]]

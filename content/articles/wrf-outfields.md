---
title: "不重编译 WRF，如何用 outfields.txt 增减输出变量"
description: "说明如何通过 iofields 和 outfields.txt 增减 WRF 输出变量，并区分它与修改 Registry 的边界。"
date: 2026-06-25
collection: "大气模式与数据实操"
permalink: /wrf-outfields
tags:
  - WRF
  - 输出变量
  - Registry
---
WRF/WRF-Chem 默认输出变量很多，但真正分析时经常会遇到两类需求：

- 某些变量太多，想从 `wrfout` 里删掉，减少文件体积；
- 某些诊断变量默认不输出，想临时加出来，但又不想重新编译 WRF。

这时可以使用 `iofields_filename` 配合 `myoutfields_d01.txt` 这类文本文件，在不重新编译的情况下增减输出变量。

> [!summary]
> 适用场景：变量已经在 Registry 中存在，只是默认没有输出到目标 history stream。
>
> 不适用场景：变量本身没有注册，或者当前物理/化学方案根本不会生成这个变量。

# 1. 在 namelist.input 中启用 iofields

在 `namelist.input` 的 `&time_control` 部分加入：

```fortran
iofields_filename      = "myoutfields_d01.txt",
ignore_iofields_warning = .true.,
```

如果有嵌套网格，需要给每个 domain 配一个文件：

```fortran
iofields_filename      = "myoutfields_d01.txt", "myoutfields_d02.txt",
ignore_iofields_warning = .true.,
```

> [!tip]
> `ignore_iofields_warning = .true.` 表示遇到无法处理的变量时继续运行并给出警告。调试阶段建议先看 `rsl.error.*` 确认变量是否成功加入。

# 2. 在 myoutfields_d01.txt 中添加变量

示例：把光解速率和臭氧过程分析相关变量输出到主 `wrfout`。

```txt
+:h:0:PHOTR2,PHOTR3,PHOTR4,PHOTR5,PHOTR6
+:h:0:chem_o3,advh_o3,advz_o3,vmix_o3,conv_o3
```

其中各字段含义为：

| 字段 | 含义 |
|---|---|
| `+` | 添加变量 |
| `-` | 删除变量 |
| `h` | history 输出 |
| `0` | 主输出流，即 `wrfout` |
| 后面的变量名 | 要增减的 WRF 变量 |

如果想从主输出中删除变量，可以写：

```txt
-:h:0:RAINC,RAINNC
```

# 3. 输出到辅助数据流

有时不希望把诊断变量混在主 `wrfout` 中，可以输出到辅助文件，例如 `auxhist13` 和 `auxhist14`。

`myoutfields_d01.txt`：

```txt
+:h:13:PHOTR2,PHOTR3,PHOTR4,PHOTR5,PHOTR6
+:h:14:chem_o3,advh_o3,advz_o3,vmix_o3,conv_o3
```

同时需要在 `namelist.input` 中设置辅助输出流：

```fortran
auxhist13_outname      = 'irr_d<domain>_<date>'
auxhist13_begin_d      = 0,
auxhist13_interval_m   = 60,
frames_per_auxhist13   = 1,
io_form_auxhist13      = 2,

auxhist14_outname      = 'ipr_d<domain>_<date>'
auxhist14_begin_d      = 0,
auxhist14_interval_m   = 60,
frames_per_auxhist14   = 1,
io_form_auxhist14      = 2,
```

> [!warning]
> 辅助输出流编号不要随便选。一般避免使用 `1`、`2`、`5`、`23` 这类 WRF 已经有特殊用途或容易冲突的 stream。

# 4. 怎么知道变量名能不能用

变量名需要在 Registry 文件中存在。WRF-Chem 常看：

- `Registry/registry.chem`
- `Registry/registry.var_chem`

例如 Registry 中可能有如下定义：

```txt
# Entry Type Sym Dims Use Tlev Stag IO Dname Descrip
state real ph_o31d ikj misc 1 - r "PHOTR2" "O31D Photolysis Rate" "min{-1}"
```

这里真正写进 `myoutfields_d01.txt` 的是 `Dname` 对应的输出变量名，例如 `PHOTR2`。

# 5. 常见问题

> [!failure] Variable not found
> 有些变量虽然能在 Registry 里找到，但当前参数化方案不会生成。比如某些光解变量只在特定光解方案下存在。此时 `real.exe` 或 `wrf.exe` 可能在 `rsl.error.*` 中提示 `Variable not found`。

> [!warning] 单行不要太长
> `myoutfields_d01.txt` 的单行长度有限。如果一次写太多变量，可能出现 `Unable to modify mask for …` 之类的问题。更稳妥的做法是拆成多行。

> [!note] 文本格式要干净
> 不要在变量列表中写空格；不要使用 `!` 写注释；文件要保证 WRF 运行时可读。

# 6. 和修改 Registry 有什么区别

| 方法 | 是否需要重编译 | 适用场景 |
|---|---|---|
| 修改 Registry | 需要 | 彻底改变变量注册和默认输出行为 |
| 使用 outfields.txt | 不需要 | 临时增减已注册变量 |

如果只是临时输出一些诊断变量，优先使用 `outfields.txt`；如果变量没有注册，或者要长期修改输出逻辑，才考虑改 Registry 并重新编译。

# 总结

`iofields_filename` 是 WRF 后处理和敏感性实验中非常实用的功能。它最大的价值是：不用重编译，就能快速控制 `wrfout` 或辅助输出文件中的变量。

我自己的使用习惯是：

1. 先在 Registry 里确认变量名；
2. 用 `myoutfields_d01.txt` 少量测试；
3. 跑 `real.exe` 后检查 `rsl.error.*`；
4. 确认无误后再正式跑长时间模拟。

## 相关阅读

- [[wrf-lcz|WRF 中如何接入 LCZ]]
- [[wrf-vertical-coordinates|WRF｜垂直高度的换算]]

---
title: "ACP｜排放反演如何改写臭氧敏感性分布"
description: "联合校正 NOₓ 与 VOCs 排放后，模式中的臭氧敏感性分区和控制时机都会发生改变。"
date: 2026-08-12
collection: "论文与方法解析"
permalink: /emission-inversion-ozone-sensitivity
tags:
  - 文献精读
  - 臭氧污染
  - 排放反演
  - CMAQ
---

用化学传输模式制定臭氧控制方案时，敏感性诊断通常从一套排放清单出发。清单如果把 NOₓ 的小时变化或 VOCs 的空间分布写错，模式不仅会算错浓度，还可能选错优先控制的前体物。

这篇发表于 _Atmospheric Chemistry and Physics_ 的研究，把卫星柱浓度、地面逐小时监测与 CMAQ 伴随模式接入同一套反演框架。作者先校正韩国的 NOₓ 与 VOCs 排放，再重新诊断臭氧敏感性，并追踪不同时刻的排放会怎样影响午后臭氧。

> [!summary]
> 排放清单的时空误差会传递到臭氧敏感性判断，同时约束 NOₓ 与 VOCs 才更容易找对控制对象和控制时段。

# 文献信息

**题目**　Spatiotemporal optimization of NOx and VOC emissions using a hybrid inversion framework and implications for ozone sensitivity-regime diagnosis<br>
**中文题目**　混合反演框架下 NOₓ 与 VOCs 排放的时空优化及其对臭氧敏感性诊断的影响<br>
**作者**　Jeonghyeok Moon、Wonbae Jeon*<br>
**版本**　_Atmospheric Chemistry and Physics_，第 26 卷，10379–10398 页，2026 年 7 月 24 日发表<br>
**链接**　[https://doi.org/10.5194/acp-26-10379-2026](https://doi.org/10.5194/acp-26-10379-2026)

# 要把排放清单校准

研究模拟 2022 年 5 月 1 日至 14 日，先验人为排放来自基础年份为 2018 年的 EDGAR-HTAPv3。四年的时间差、月排放向小时排放的分配，以及生物源 VOCs 模式，都可能让清单偏离当时的大气状态。

混合反演分成两步。FDMB 利用 TROPOMI 的 NO₂ 和 HCHO 柱浓度校正 NOₓ、人为 VOCs 和生物源 VOCs 的空间分布；4D-Var 再同化地面逐小时 NO₂ 和 O₃，继续优化一天内的排放变化。

![[ACP｜排放反演如何改写臭氧敏感性地图-20260805.png]]

联合反演后，NOₓ 排放相对先验平均下降 15.5%，人为 VOCs 和生物源 VOCs 则分别增加约 70.5% 和 161.6%。地面 O₃ 的平均偏差从 −6.28 ppb 变为 0.24 ppb，一致性指数也有上升。只反演 NOₓ 主要改善夜间臭氧，加入 VOCs 后，白天模拟也更接近观测。

生物源 VOCs 的调整幅度很大。HCHO 对 VOCs 只有间接约束，这个增量可能同时补偿排放、化学机制、氧化能力、输送和卫星反演误差。

# 敏感性区域分布跟着变化

论文用 HCHO/NO₂ 柱浓度比诊断臭氧敏感性。原始清单驱动的模式把韩国大部分地区判为 VOC-sensitive。联合反演降低部分 NOₓ 并提高 VOCs 后，更多山地和植被区转为 NOₓ-sensitive，主要城市仍以 VOC-sensitive 为主。

![[ACP｜排放反演如何改写臭氧敏感性地图-20260805-1.png]]

这个变化会直接影响控制选择。沿用先验结果，韩国多数地区都会优先控制 VOCs；使用后验排放后，NOₓ 控制在更多山地和植被区成为更直接的降臭氧手段。

# 同一种排放，时刻不同，作用也不同

作者继续用 CMAQ 模式追踪每个小时的 NOₓ 和 VOCs 排放会怎样影响臭氧，并专门分析 15 时臭氧对之前各小时排放的响应。

![[ACP｜排放反演如何改写臭氧敏感性地图-20260805-2.png]]

在 VOC-sensitive 区域，NOₓ 的负响应主要来自快速滴定，VOCs 则在白天促进臭氧生成。对 15 时臭氧而言，15 时排放的 NOₓ 几乎立即产生负响应，13 时排放的 VOCs 约两小时后形成最大正贡献。

进入 NOₓ-sensitive 后，NOₓ 的作用会随时刻改变。夜间仍以滴定为主，上午后期到下午则促进臭氧生成。要压低午后峰值，控制措施需要同时考虑敏感性分区和前体物发生作用所需的时间。

这项分析只覆盖 5 月的两周，生物源排放较活跃，结果还不能代表全年。它更适合说明一种工作方式。先用观测校正排放，再判断控制对象，最后把排放时刻与臭氧峰值联系起来。若要形成季节性方案，还需要把同一套分析扩展到更多月份。

## 相关阅读

- [[jiangsu-ozone-diagnosis|文献精读｜如何诊断江苏臭氧污染过程]]
- [[cmaq-isam|CMAQ-ISAM：从 EmissCtrl 到 GRIDMASK]]

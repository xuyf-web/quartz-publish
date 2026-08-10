---
title: "matplotlib 里如何设置中英文混排"
description: "分别说明普通中英文混排和包含公式时的混排方法。"
date: 2026-08-10
collection: "科研工作流与工具链"
tags:
  - Matplotlib
  - Python绘图
  - 科研绘图
  - 字体排版
permalink: /matplotlib-mixed-fonts
---

科研绘图通常以英文为主，但标题、坐标轴和图内说明有时也要写中文。普通的中英文混排只需要设置字体顺序；字符串里加入公式以后，还要多处理一步。

> [!summary]
> 不含公式时设置中英文字体，含有公式时再把普通文字和公式分开绘制。

# 不含公式时，设置字体顺序

只写中文和英文时，可以把西文字体放在前面，中文字体放在后面：

```python
mpl.rcParams["font.family"] = ["Times New Roman", "SimSun"]
```

英文会优先使用 Times New Roman，汉字则使用 SimSun。字体名称要和电脑里已经安装的字体一致，如果没有这两种字体，换成自己正在使用的西文字体和中文字体即可。

# 含有公式时，分开绘制再拼接

字符串里加入 `$…$` 公式后，原本正常的中文有时会变成方框。只调整公式字体通常解决不了这个问题。

![[matplotlib 里如何设置中英文混排-20260806.png]]

正确做法是把普通文字和公式拆开绘制，中文和公式便能各自使用合适的字体。

## 核心脚本

下面这个函数会找到 `$…$` 包围的公式，把公式与普通文字分开绘制，再放回同一行。

```python
MATH_SPLIT = re.compile(r"(\$[^$]*\$)")

def mixed_text(ax, x, y, text, fontsize=16):
    parts = [part for part in MATH_SPLIT.split(text) if part]
    children = [
        TextArea(part, textprops={"fontsize": fontsize})
        for part in parts
    ]
    box = HPacker(children=children, align="center", pad=0, sep=0)
    artist = AnnotationBbox(
        box,
        (x, y),
        xycoords="axes fraction",
        frameon=False,
        box_alignment=(0.5, 0.5),
    )
    ax.add_artist(artist)
    return artist
```

调用时，把需要显示的内容传给 `mixed_text()` 即可，例如 `mixed_text(ax, 0.5, 0.5, r"近地面风速 $v_{10}$", fontsize=20)`。普通文字直接写，公式仍然放在 `$…$` 里面。

中文、英文和公式的最终效果如下。

![[matplotlib 里如何设置中英文混排-20260806-1.png]]

同一个函数也可以继续放到标题、坐标轴标签和图内注释中。

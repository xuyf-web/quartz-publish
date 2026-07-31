---
title: "uv 管理 Python 环境：从入门到和 Conda 的取舍"
description: "从 Python 版本、虚拟环境和项目依赖出发，介绍 uv 的用法及其与 Conda 的取舍。"
date: 2026-07-03
collection: "科研工作流与工具链"
permalink: /uv-python-environments
tags:
  - Python
  - uv
  - 环境管理
  - Conda
---
# 引言

用 Python 做科研数据处理、机器学习或服务器脚本时，环境问题经常不是一开始就爆出来，而是在项目多了、服务器换了、依赖升级了之后慢慢变麻烦：

- 项目 A 需要 `python=3.10`，项目 B 需要 `python=3.12`；
- `pip install` 以后环境越来越乱，不知道哪个包是谁装的；
- 换一台服务器后，原来的环境很难完整复现；
- `conda solve environment` 等很久，最后还可能冲突；
- 想临时跑一个脚本，却不想污染当前环境。

过去我通常会用 conda 解决这些问题。现在如果项目主要是 Python 包，尤其是来自 PyPI 的包，我会优先考虑 `uv`。

`uv` 是 Astral 做的 Python 包和环境管理工具，可以理解为把 `pip`、`pip-tools`、`virtualenv`、`pyenv`、`pipx` 的一部分能力放到了一套命令里。它最直接的好处是安装快、命令少、项目依赖更容易锁住。

> [!summary]
> **uv 更适合管理 Python 项目，conda 更适合管理带有复杂二进制依赖的环境**。如果依赖主要来自 PyPI，uv 往往更轻；如果需要 C/C++/Fortran、CUDA、MPI、GDAL、ESMF、NetCDF 这类依赖，conda 仍然很有价值。

# uv 解决的环境问题

Python 环境管理本来就分成几层：

| 层级 | 典型问题 | 传统工具 | uv 对应能力 |
|---|---|---|---|
| Python 版本 | 这个项目用 3.10 还是 3.12 | pyenv、conda | `uv python install` |
| 虚拟环境 | 依赖要不要隔离 | venv、virtualenv、conda env | `uv venv`、项目 `.venv` |
| 包安装 | 安装、升级、卸载依赖 | pip | `uv pip`、`uv add`、`uv remove` |
| 依赖锁定 | 怎么保证别人装出一样的环境 | pip-tools、Poetry、PDM | `uv.lock` |
| 命令运行 | 临时跑脚本或工具 | pipx、手动激活环境 | `uv run`、`uv tool` |

很多人觉得 Python 环境乱，是因为这些层混在一起了。比如：

```bash
conda activate base
pip install pandas
pip install geopandas
pip install torch
```

这样短期能跑，但后面很难追踪：这些包到底属于哪个项目、谁引入了哪个依赖、半年以后还能不能装出同样的环境，都会变得不清楚。

uv 的思路是：**把环境和项目绑定起来**。一个项目一个 `.venv`，依赖写进 `pyproject.toml`，解析结果写进 `uv.lock`，运行命令时用 `uv run` 自动进入正确环境。

# 安装与基础环境

## 安装 uv

macOS 和 Linux 可以用官方安装脚本：

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

如果已经有 Homebrew：

```bash
brew install uv
```

如果在 Windows 上，可以用 PowerShell：

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

也可以通过 pip 安装：

```bash
pip install uv
```

安装后检查版本：

```bash
uv --version
```

> [!note]
> 在服务器上，如果你没有管理员权限，通常也可以把 uv 安装到自己的用户目录。关键是确认 `uv` 所在路径已经加入 `PATH`。

## 管理 Python 版本

uv 可以直接安装 Python：

```bash
uv python install 3.12
uv python install 3.11
```

查看可用版本：

```bash
uv python list
```

指定项目使用某个版本：

```bash
uv python pin 3.12
```

这会在当前目录写入 `.python-version`，表示这个项目默认使用 Python 3.12。

如果你只是想临时用某个版本运行脚本：

```bash
uv run --python 3.12 python --version
```

> [!tip]
> 以前我会用 `pyenv` 管 Python 版本、`venv` 管虚拟环境、`pip` 装包。uv 的好处是把这些动作收进了一个命令体系里，服务器迁移和新机器配置会更省心。

## 创建虚拟环境

最基础的用法和 `python -m venv` 类似：

```bash
uv venv
```

默认会在当前目录创建 `.venv`。

指定 Python 版本：

```bash
uv venv --python 3.12
```

激活环境：

```bash
source .venv/bin/activate
```

然后可以像平时一样使用：

```bash
python --version
which python
```

不过，用 uv 时不一定非要手动激活环境。更推荐的方式是：

```bash
uv run python script.py
```

`uv run` 会自动找到当前项目的环境，并在其中运行命令。

# 包管理与项目管理

## `uv pip`：作为 pip 的高速替代

如果你暂时还不想改项目结构，只想更快地安装包，可以先用 `uv pip`。

创建环境：

```bash
uv venv
source .venv/bin/activate
```

安装包：

```bash
uv pip install numpy pandas matplotlib
```

从 `requirements.txt` 安装：

```bash
uv pip install -r requirements.txt
```

导出当前环境：

```bash
uv pip freeze > requirements.txt
```

同步环境到一个 requirements 文件：

```bash
uv pip sync requirements.txt
```

`sync` 和普通安装不一样。它不是“缺什么装什么”，而是让当前环境和文件保持一致：文件里没有的包会被移除。

> [!warning]
> `uv pip sync` 会删除不在 requirements 文件里的包。适合可复现环境，不适合在一个随手试验的环境里乱用。

## 项目模式：日常推荐用法

如果是新项目，更建议直接使用 uv 的项目模式。

新建项目：

```bash
uv init my-project
cd my-project
```

项目里通常会出现：

```txt
my-project/
├── .python-version
├── pyproject.toml
├── README.md
└── src/
```

添加依赖：

```bash
uv add numpy pandas matplotlib
```

添加开发依赖：

```bash
uv add --dev pytest ruff ipykernel
```

运行脚本：

```bash
uv run python main.py
```

运行测试：

```bash
uv run pytest
```

运行格式检查：

```bash
uv run ruff check .
```

uv 会维护两个关键文件：

| 文件 | 作用 |
|---|---|
| `pyproject.toml` | 记录项目的直接依赖和项目元信息 |
| `uv.lock` | 记录完整解析后的依赖版本，保证复现 |

`pyproject.toml` 像是“我想要什么”，`uv.lock` 像是“最终装成了什么”。

> [!important]
> 如果这是一个需要复现的项目，建议把 `pyproject.toml` 和 `uv.lock` 都提交到 Git。别人拿到项目后执行 `uv sync`，就能尽量得到一致的环境。

## 从已有项目迁移到 uv

如果你手里已经有一个 `requirements.txt` 项目，可以这样迁移。

第一步，在项目目录初始化：

```bash
uv init
```

第二步，从 requirements 添加依赖：

```bash
uv add -r requirements.txt
```

第三步，同步环境：

```bash
uv sync
```

以后就用：

```bash
uv add package-name
uv remove package-name
uv run python script.py
```

如果你暂时不想完全迁移，也可以只保留：

```bash
uv venv
uv pip install -r requirements.txt
uv run python script.py
```

这属于低风险过渡方案。

## 临时脚本：不用先创建项目

有时候只是想临时跑一段脚本，比如测试某个库：

```bash
uv run --with rich python -c "from rich import print; print('[green]hello uv[/green]')"
```

也可以运行一个本地脚本，并临时注入依赖：

```bash
uv run --with pandas --with matplotlib python quick_plot.py
```

这种用法适合：

- 临时数据检查；
- 分享一个最小复现脚本；
- 在干净环境里验证某个包；
- 不想污染当前项目依赖。

uv 也支持脚本元数据。比如一个单文件脚本可以在文件头写依赖，运行时自动创建隔离环境。这对分享小工具很有用。

## 命令行工具：替代一部分 pipx 用法

很多 Python 工具其实不是项目依赖，而是全局命令，比如 `ruff`、`black`、`httpie`、`jupyterlab`。

用 uv 安装工具：

```bash
uv tool install ruff
uv tool install httpie
```

运行一次性工具：

```bash
uvx ruff check .
uvx cowsay hello
```

`uvx` 可以理解为“临时下载并运行一个 Python 命令行工具”，类似 `pipx run`。

> [!tip]
> 我一般把“项目需要的工具”放进项目 dev 依赖，比如 `uv add --dev ruff pytest`；把“到处都要用的个人命令”用 `uv tool install` 安装。

## Jupyter 和 Notebook 怎么配

科研工作流里经常要用 Jupyter。一个比较稳的做法是让每个项目环境注册自己的 kernel。

在项目里添加依赖：

```bash
uv add --dev ipykernel
```

注册 kernel：

```bash
uv run python -m ipykernel install --user --name my-project --display-name "Python (my-project)"
```

然后在 JupyterLab 或 VS Code 里选择这个 kernel。

如果还需要 JupyterLab 本身，可以作为工具安装：

```bash
uv tool install jupyterlab
```

或者在某个项目里安装：

```bash
uv add --dev jupyterlab
uv run jupyter lab
```

两种方式都可以。前者适合把 JupyterLab 当全局工具，后者适合项目完全自包含。

# uv 和 conda 怎么选

## 核心区别

uv 和 conda 最容易被混在一起，但它们解决问题的边界并不完全一样。

| 对比项 | uv | conda |
|---|---|---|
| 核心定位 | Python 包、项目、虚拟环境管理 | 跨语言包和二进制环境管理 |
| 主要包来源 | PyPI | conda channels，比如 defaults、conda-forge |
| Python 版本管理 | 支持安装和选择 Python | 支持安装和选择 Python |
| 虚拟环境 | 通常是项目内 `.venv` | 通常是集中式 `envs/` 环境 |
| 锁文件 | `uv.lock` | 原生更依赖 `environment.yml`，严格锁定通常需额外工具 |
| 速度 | 通常非常快 | 解析复杂环境时可能较慢，mamba 会快很多 |
| 非 Python 依赖 | 主要依赖 wheel 能否解决 | 强项，可装 C/C++/Fortran 库和系统级二进制包 |
| 适合场景 | 纯 Python 项目、Web、CLI、数据分析、轻量 ML | 科学计算、地理空间、HPC、CUDA、复杂编译依赖 |
| 学习成本 | 命令少，项目模式清晰 | 概念更多，channel 和 solver 需要理解 |

> [!summary]
> **uv 管的是 Python 项目；conda 管的是一个更接近“小型用户态系统”的环境。**

## conda 仍然适合的场景

不要把 uv 理解成“conda 的完全替代品”。在很多科研场景里，conda 仍然更稳。

典型例子包括：

- `gdal`、`geopandas`、`rasterio`、`cartopy` 等地理空间栈；
- `netcdf4`、`hdf5`、`eccodes`、`cfgrib` 等科学数据格式；
- `esmpy`、`xesmf`、`ESMF` 相关重网格工具；
- 需要特定版本 CUDA、cuDNN、NCCL 的深度学习环境；
- 依赖 MPI、Fortran、C/C++ 编译链的包；
- 学校或课题组服务器已经围绕 conda module 搭好了环境。

这些依赖不只是 Python 包。它们背后还有一堆动态库、头文件、编译选项和 ABI 兼容问题。conda-forge 的价值就在这里：它提供的是一整套二进制包生态。

> [!important]
> 如果一个包在 PyPI 上安装时需要本地编译大量 C/C++/Fortran 代码，而你又不想处理编译器和系统库，优先试 conda-forge 往往更省时间。

## uv 更适合的场景

uv 的优势在这些地方更明显：

- 项目主要依赖来自 PyPI；
- 需要频繁创建、删除、同步环境；
- 希望每个项目自带 `.venv`，减少全局环境污染；
- 需要快速 CI 安装依赖；
- 想用 `pyproject.toml` 管理项目依赖；
- 需要锁定完整依赖版本；
- 经常写命令行小工具、自动化脚本、数据处理脚本；
- 不希望一上来就引入 conda 的 channel、solver、base environment 等复杂度。

例如一个普通数据分析项目：

```bash
uv init air-quality-analysis
cd air-quality-analysis
uv add pandas xarray matplotlib scipy netcdf4
uv add --dev jupyterlab ipykernel pytest ruff
uv run jupyter lab
```

如果这些包都能通过 wheel 正常安装，uv 会非常顺手。

## 能不能混用 uv 和 conda

可以，但要有边界。

比较稳的混用方式是：用 conda 提供底层 Python 和复杂二进制库，再在这个环境里用 uv 管理 Python 包。

例如：

```bash
conda create -n geo python=3.11 gdal proj geos netcdf4 -c conda-forge
conda activate geo
uv pip install pandas matplotlib seaborn
```

这种方式适合临时分析，但长期项目要小心：conda 和 pip/uv 同时改一个环境，容易让依赖来源混杂。

更清晰的做法是二选一：

- 纯 Python 项目：`uv init` + `uv add` + `uv lock`；
- 复杂科学计算环境：`environment.yml` + conda/mamba；
- 需要混用时：先用 conda 固定底层二进制依赖，再尽量减少 uv/pip 安装范围。

> [!note]
> 如果团队协作，最好在 README 里明确环境创建方式。不要让一个人用 `conda env create`，另一个人用 `uv sync`，最后两边都以为自己是“标准环境”。

# 工作流

## 常见工作流示例

### 场景一：新建一个数据分析项目

```bash
uv init pm25-analysis
cd pm25-analysis
uv python pin 3.12
uv add numpy pandas xarray scipy matplotlib
uv add --dev jupyterlab ipykernel ruff
uv run python -m ipykernel install --user --name pm25-analysis --display-name "Python (pm25-analysis)"
```

以后运行：

```bash
uv run jupyter lab
uv run python scripts/process.py
```

### 场景二：复现别人的 uv 项目

```bash
git clone <repo>
cd <repo>
uv sync
uv run python main.py
```

如果项目指定了 Python 版本，uv 会按项目配置处理。

### 场景三：从 requirements.txt 创建环境

```bash
uv venv --python 3.11
source .venv/bin/activate
uv pip install -r requirements.txt
uv run python main.py
```

### 场景四：服务器上快速跑脚本

```bash
uv run --with pandas --with openpyxl python convert_excel.py
```

跑完不需要专门清理项目环境。

### 场景五：保留 conda 的地理空间底层库

```bash
conda create -n geo python=3.11 gdal rasterio geopandas -c conda-forge
conda activate geo
uv pip install seaborn tqdm rich
```

这不是最纯粹的方式，但在科研服务器上很实用。

## 命令速查

uv 项目：

```bash
uv init my-project
cd my-project
uv python pin 3.12
uv add pandas matplotlib
uv add --dev pytest ruff
uv run python main.py
uv sync
```

uv 虚拟环境：

```bash
uv venv --python 3.12
source .venv/bin/activate
uv pip install -r requirements.txt
uv pip sync requirements.txt
```

uv 工具：

```bash
uv tool install ruff
uvx ruff check .
```

conda 环境：

```bash
conda create -n myenv python=3.11
conda activate myenv
conda install numpy pandas -c conda-forge
conda env export > environment.yml
conda env create -f environment.yml
```

# 结语

uv 把很多原本分散的 Python 环境管理动作收到了一个工具里。对大多数纯 Python 项目来说，它能明显减少装环境和同步依赖的时间。

# 参考资料

- [uv 官方文档](https://docs.astral.sh/uv/)
- [uv：项目概念](https://docs.astral.sh/uv/concepts/projects/)
- [uv：Python 版本管理](https://docs.astral.sh/uv/concepts/python-versions/)
- [uv：工具管理](https://docs.astral.sh/uv/concepts/tools/)

## 相关阅读

- [[research-project-folders|科研项目文件夹怎么组织]]
- [[linux-research-tools|科研服务器上我常用的 Linux 小工具]]
- [[research-git|AI 时代，科研项目为什么更需要 Git]]

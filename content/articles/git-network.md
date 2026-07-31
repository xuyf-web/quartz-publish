---
title: "Git网络连接"
description: "整理 Windows 与 Linux 服务器上通过 HTTPS 或 SSH 连接 GitHub 的配置和排错方法。"
date: 2025-02-17
collection: "科研工作流与工具链"
permalink: /git-network
tags:
  - Git
  - SSH
  - GitHub
  - 网络配置
---
本篇介绍当使用 Git 推送本地代码至 Github 遇到连接失败的问题时的解决办法

```bash
failed to connect to 127.0.0.1 port 1080
```

# Windows

使用 cmd 输入

```bash
git config --global http.proxy
git config --global https.proxy
```

显示如下

```bash
http://127.0.0.1:1080
```

要将端口修改为目前网络的端口，在设置中查看网络代理的端口，我这里是 7890

使用 cmd 修改

```bash
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy https://127.0.0.1:7890
```

修改后可再用上述命令查看是否修改成功，再次使用 git 可顺利完成

# 服务器（Linux）

## 1. **查看服务器网络端口**

在连接 GitHub 时，通常使用 HTTPS 或 SSH 协议。首先，确认服务器的网络端口是否支持这两种协议。

可以使用 `netstat` 命令来查看服务器上开放的网络端口：

```bash
netstat -tuln

# 具体看某个端口
netstat -tuln | grep ':443'
```

查看输出，特别关注以下端口：

- **443**：支持 HTTPS 连接。
- **22**： 支持 SSH 协议。

## 2. **使用 HTTPS 时**

如果看到这样的结果：

```bash
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0         0           0.0.0.0:443               0.0.0.0:*                     LISTEN
```

或

```bash
tcp6       0      0 :::443                 :::*                    LISTEN
```

代表 443 端口支持连接，此时使用与 Windows 相同的方法，将 http.proxy 等代理设置好即可。

## 3. **使用 SSH 时**

SSH 是 GitHub 推荐的安全连接方式。以下是通过 SSH 连接的完整步骤。

### 3.1 **创建密钥或使用已有密钥**

**查看现有的 SSH 密钥**

如果你已经生成过 SSH 密钥，可以直接使用现有的密钥文件。首先，检查是否已经有 `id_rsa` 和 `id_rsa.pub` 文件：

```bash
ls ~/.ssh/id_rsa
```

如果文件存在，说明你已有密钥，可以跳过密钥生成步骤。

**生成新的 SSH 密钥对**

如果没有密钥，或者你希望生成一对新的密钥，可以使用以下命令：

```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

- `your_email@example.com` 是你在 GitHub 上注册的邮箱。
- 你可以按回车接受默认的密钥存储位置 `~/.ssh/id_rsa`。

生成密钥后，默认生成两个文件：`id_rsa`（私钥）和 `id_rsa.pub`（公钥）。

### 3.2 **在 GitHub 添加公钥，检查连接状态**

**添加公钥到 GitHub**

将公钥 `id_rsa.pub` 内容复制到 GitHub 上：

1. 查看公钥内容：

   ```bash
   cat ~/.ssh/id_rsa.pub
   ```

2. 登录 GitHub，进入 **Settings** > **SSH and GPG keys**，点击 **New SSH key**。
3. 粘贴公钥内容并保存。

**测试 SSH 连接**

确认密钥已正确配置，可以使用以下命令测试 SSH 连接：

```bash
ssh -T git@github.com
```

如果配置成功，你会看到如下输出：

```
Hi xuyf-web! You've successfully authenticated, but GitHub does not provide shell access.
```

这表示你的 SSH 密钥已正确配置，并成功连接到 GitHub。

---

### 3.3 **在服务器创建使用 SSH 连接的库，或将已有库修改为 SSH 连接**

**创建新的仓库并使用 SSH 连接**

1. **初始化新仓库**：

   ```bash
   mkdir new-repository
   cd new-repository
   git init
   ```

2. **设置远程仓库 URL 为 SSH**：

   ```bash
   git remote add origin git@github.com:xuyf-web/new-repository.git
   ```

3. **推送代码到 GitHub**：

   ```bash
   git push -u origin main
   ```

这样，你的仓库将通过 SSH 连接到 GitHub。

**将已有仓库修改为 SSH 连接**

如果你的仓库原来使用的是 HTTPS 连接，想要改为使用 SSH 连接，可以使用以下命令：

1. **查看当前远程仓库 URL**：

   ```bash
   git remote -v
   ```

2. **修改远程仓库 URL 为 SSH 格式**：

   ```bash
   git remote set-url origin git@github.com:xuyf-web/repository.git
   ```

3. **验证修改是否成功**：

   ```bash
   git remote -v
   ```

   输出应该显示使用 SSH 协议的 URL：

   ```
   origin  git@github.com:xuyf-web/repository.git (fetch)
   origin  git@github.com:xuyf-web/repository.git (push)
   ```

4. **推送代码到 GitHub**：

   ```bash
   git push origin main
   ```

## 相关阅读

- [[vscode-remote-ssh-guide|VS Code 连接服务器及使用注意事项]]
- [[claude-code-server|如何在服务器上使用 Claude Code]]
- [[research-git|AI 时代，科研项目为什么更需要 Git]]

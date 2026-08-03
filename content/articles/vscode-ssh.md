---
title: "VS Code使用SSH"
description: "记录使用 VS Code 通过 SSH 连接服务器以及配置密钥登录的基本步骤。"
date: 2025-02-17
collection: "科研工作流与工具链"
permalink: /vscode-ssh
tags:
  - VSCode
  - SSH
  - 远程开发
---
# 1.本地配置

在 VS Code 中下载插件：Remote-SSH

![[Pasted image 20240926165008.png]]

进入插件点击 SSH 行的设置，更新配置文件，选择第一个

![[Pasted image 20240926165056.png]]

按照下图形式填充服务器信息，Host 是在本地的名称，可随意

![[Pasted image 20250217160002.png]]

保存后点击即可连接，会弹出提示框输入用户密码

# 2. 免密钥设置

VS Code 本地是不能记录密码的，因此每次登录都需要输入一遍密码，如果想要跳过这一步骤，则需要：

在本地打开命令行（Win+R，输入 cmd），命令行中输入

```bash
ssh-keygen -t rsa
```

之后一路回车，直到运行完成

![[Pasted image 20250217160151.png]]

在图中所示路径找到.ssh/id_rsa.pub 公钥文件，将其上传至服务器

在服务器上进入.ssh 目录，运行命令

```bash
cd .ssh
cat your_directory/id_rsa.pub >> authorized_keys
```

这样以后再使用 VS Code 的 SSH 时可以不再输入密码登录

## 相关阅读

- [[vscode-remote-ssh-guide|VS Code 连接服务器及使用注意事项]]
- [[git-network|Git网络连接]]

# 亦非笔记网站

这是使用 [Quartz 5](https://quartz.jzhao.xyz/) 构建的静态网站，正式地址为 <https://xuyf.net/>。

网站内容来自独立维护的 `wechat/Writings/` 原稿，经人工整理为 `content/articles/` 下的网站版。仓库只保留获准发布的内容及其实际引用资源，不包含未发布草稿。

## 部署架构

```text
本地 Markdown -> Quartz -> GitHub v5 -> Vercel -> xuyf.net
```

- Quartz 将 `content/` 编译为 `public/` 下的 HTML、CSS、JavaScript 和搜索索引。
- GitHub 仓库 `xuyf-web/quartz-publish` 保存源码和版本历史。
- Vercel 监听 `v5` 分支，每次推送后自动执行 `npm ci` 和 `npx quartz build`，再发布 `public/`。
- 阿里云负责 `xuyf.net` 的权威 DNS；Vercel 负责 CDN、HTTPS 证书以及 HTTP 到 HTTPS 的跳转。
- `www.xuyf.net` 使用 308 永久重定向到 `https://xuyf.net/`。

GitHub Pages 部署工作流已经停用，日常发布不需要修改 DNS，也不需要手动上传 `public/`。

## 本地预览

需要 Node.js 22 或更高版本。

```bash
npm ci
npx quartz build --serve
```

## 发布方式

确认本地构建和 Git 差异后，将预期文件提交并推送到 `v5`：

```bash
git push origin v5
```

Vercel 会自动构建和部署。推送成功不等于发布完成；还需要等待 Vercel 部署显示 `Ready`，并访问正式 HTTPS 页面验收。

完整的原稿准备、网站版转换、审计、同步、构建、提交和验收步骤见工作区根目录的 `网站部署与本地发布指南.md`。

Quartz 源码采用 MIT 许可证。文章与图片的版权仍归内容作者所有。

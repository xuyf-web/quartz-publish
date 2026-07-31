# 科研与技术笔记

这是一个使用 [Quartz 5](https://quartz.jzhao.xyz/) 构建的 Obsidian 笔记试验站。

当前只发布三篇文章及其实际引用的图片，用于验证中文排版、长文目录、代码块、Callout、全文搜索、关系图谱和移动端布局。原始 Obsidian vault 中的草稿、临时文件和未引用附件不会进入这个仓库。

网站地址：<https://xuyf-web.github.io/quartz-publish/>

## 本地预览

需要 Node.js 22 或更高版本。

```bash
npm ci
npx quartz build --serve
```

## 发布方式

推送到 `v5` 分支后，GitHub Actions 会自动构建静态文件并部署到 GitHub Pages。

Quartz 源码采用 MIT 许可证。文章与图片的版权仍归内容作者所有。

import { resolveRelative, slugTag } from "@quartz-community/utils"
import { jsx, jsxs } from "preact/jsx-runtime"

const collections = [
  ["大气模式与数据实操", "collections/atmospheric-practice/index"],
  ["科研工作流与工具链", "collections/research-workflow/index"],
  ["AI 前沿观察", "collections/ai-frontier/index"],
  ["论文与方法解析", "collections/papers-methods/index"],
]

const navLink = (href, title) =>
  jsx("li", {
    children: jsx("a", {
      class: "internal sidebar-nav-link",
      href,
      children: title,
    }),
  })

export const SidebarNavigation = () => {
  const Component = ({ fileData, allFiles }) => {
    if (fileData.slug === "index") return null

    const href = (slug) => resolveRelative(fileData.slug, slug)
    const filePages = allFiles
      .filter((page) => page.slug?.startsWith("files/") && page.slug !== "files/index")
      .sort((a, b) =>
        (a.frontmatter?.title ?? "").localeCompare(b.frontmatter?.title ?? "", "zh-CN"),
      )

    const tagCounts = new Map()
    for (const page of allFiles) {
      if (page.slug?.startsWith("tags/") || page.slug?.startsWith("collections/")) continue
      for (const tag of page.frontmatter?.tags ?? []) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
      }
    }

    const popularTags = [...tagCounts.entries()]
      .sort(
        ([tagA, countA], [tagB, countB]) => countB - countA || tagA.localeCompare(tagB, "zh-CN"),
      )
      .slice(0, 8)

    return jsxs("nav", {
      class: "site-sidebar-nav desktop-only",
      "aria-label": "内容导航",
      children: [
        jsxs("section", {
          children: [
            jsx("h3", { children: "专题笔记" }),
            jsx("ul", {
              children: collections.map(([title, slug]) => navLink(href(slug), title)),
            }),
          ],
        }),
        jsxs("section", {
          children: [
            jsx("h3", { children: "文件导航" }),
            jsxs("ul", {
              children: [
                navLink(href("files/index"), "全部文件"),
                filePages.map((page) =>
                  navLink(href(page.slug), page.frontmatter?.title ?? page.slug),
                ),
              ],
            }),
          ],
        }),
        jsxs("section", {
          children: [
            jsxs("div", {
              class: "sidebar-nav-heading",
              children: [
                jsx("h3", { children: "常用标签" }),
                jsx("a", {
                  class: "internal sidebar-nav-all",
                  href: href("tags/index"),
                  children: "全部",
                }),
              ],
            }),
            jsx("ul", {
              class: "sidebar-tag-list",
              children: popularTags.map(([tag, count]) =>
                jsx("li", {
                  children: jsxs("a", {
                    class: "internal tag-link",
                    href: href(`tags/${slugTag(tag)}`),
                    children: [tag, jsx("small", { children: count })],
                  }),
                }),
              ),
            }),
          ],
        }),
      ],
    })
  }

  return Component
}

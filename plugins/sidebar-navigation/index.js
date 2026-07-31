import { resolveRelative, slugTag } from "@quartz-community/utils"
import { jsx, jsxs } from "preact/jsx-runtime"
import styles from "./style.js"

const collections = [
  ["大气模式与数据实操", "collections/atmospheric-practice/index"],
  ["科研工作流与工具链", "collections/research-workflow/index"],
  ["AI 前沿观察", "collections/ai-frontier/index"],
  ["论文与方法解析", "collections/papers-methods/index"],
]

const navLink = (href, title, active = false, current = "page") =>
  jsx("li", {
    children: jsx("a", {
      class: `internal sidebar-nav-link${active ? " is-active" : ""}`,
      href,
      ...(active ? { "aria-current": current } : {}),
      children: title,
    }),
  })

const collectionLinks = (href, fileData) =>
  collections.map(([title, slug]) => {
    const isCollectionPage = fileData.slug === slug
    const containsCurrentArticle = fileData.frontmatter?.collection === title
    return navLink(
      href(slug),
      title,
      isCollectionPage || containsCurrentArticle,
      isCollectionPage ? "page" : "location",
    )
  })

const fileLinks = (href, filePages, fileData) => [
  navLink(href("files/index"), "全部文件", fileData.slug === "files/index"),
  filePages.map((page) =>
    navLink(href(page.slug), page.frontmatter?.title ?? page.slug, fileData.slug === page.slug),
  ),
]

const tagLinks = (href, popularTags, fileData) =>
  popularTags.map(([tag, count]) =>
    jsx("li", {
      children: jsxs("a", {
        class: `internal tag-link${fileData.slug === `tags/${slugTag(tag)}` ? " is-active" : ""}`,
        href: href(`tags/${slugTag(tag)}`),
        ...(fileData.slug === `tags/${slugTag(tag)}` ? { "aria-current": "page" } : {}),
        children: [tag, jsx("small", { children: count })],
      }),
    }),
  )

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

    return jsxs("div", {
      class: "site-navigation",
      children: [
        jsxs("nav", {
          class: "site-sidebar-nav desktop-only",
          "aria-label": "内容导航",
          children: [
            jsxs("section", {
              children: [
                jsx("h3", { children: "专题笔记" }),
                jsx("ul", { children: collectionLinks(href, fileData) }),
              ],
            }),
            jsxs("section", {
              children: [
                jsx("h3", { children: "文件导航" }),
                jsxs("ul", { children: fileLinks(href, filePages, fileData) }),
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
                  children: tagLinks(href, popularTags, fileData),
                }),
              ],
            }),
          ],
        }),
        jsxs("details", {
          class: "mobile-site-nav mobile-only",
          children: [
            jsxs("summary", {
              class: "mobile-site-nav-summary",
              children: [
                jsxs("span", {
                  class: "mobile-site-nav-heading",
                  children: [
                    jsx("strong", { children: "浏览本站内容" }),
                    jsx("small", { children: "合集 · 文件 · 标签" }),
                  ],
                }),
                jsx("span", {
                  class: "mobile-site-nav-chevron",
                  "aria-hidden": "true",
                  children: "⌄",
                }),
              ],
            }),
            jsxs("nav", {
              class: "mobile-site-nav-panel",
              "aria-label": "移动端内容导航",
              children: [
                jsxs("section", {
                  children: [
                    jsx("h3", { children: "专题笔记" }),
                    jsx("ul", {
                      class: "mobile-collection-list",
                      children: collectionLinks(href, fileData),
                    }),
                  ],
                }),
                jsxs("section", {
                  children: [
                    jsx("h3", { children: "文件导航" }),
                    jsxs("ul", {
                      class: "mobile-file-list",
                      children: fileLinks(href, filePages, fileData),
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
                          children: "查看全部",
                        }),
                      ],
                    }),
                    jsx("ul", {
                      class: "sidebar-tag-list",
                      children: tagLinks(href, popularTags, fileData),
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  }

  Component.css = styles

  return Component
}

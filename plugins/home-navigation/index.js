import { Darkmode } from "@quartz-community/darkmode"
import { Search } from "@quartz-community/search"
import { jsx, jsxs } from "preact/jsx-runtime"

const concatenateResources = (...resources) => resources.filter(Boolean).flat()

export const HomeNavigation = () => {
  const SearchComponent = Search({
    enablePreview: true,
    fieldPriority: ["title", "content", "tags"],
  })
  const DarkmodeComponent = Darkmode()

  const Component = (props) => {
    if (props.fileData.slug !== "index") return null

    return jsxs("div", {
      class: "home-topbar",
      children: [
        jsx("a", {
          class: "home-topbar-brand internal-link",
          href: ".",
          children: "亦非笔记",
        }),
        jsxs("nav", {
          class: "home-topbar-links",
          "aria-label": "首页导航",
          children: [
            jsx("a", { href: "#research-work", children: "研究工作" }),
            jsx("a", { href: "#featured-notes", children: "专题笔记" }),
            jsx("a", { href: "#file-sharing", children: "文件分享" }),
          ],
        }),
        jsxs("div", {
          class: "home-topbar-tools",
          children: [jsx(SearchComponent, { ...props }), jsx(DarkmodeComponent, { ...props })],
        }),
      ],
    })
  }

  Component.css = concatenateResources(SearchComponent.css, DarkmodeComponent.css)
  Component.beforeDOMLoaded = concatenateResources(
    SearchComponent.beforeDOMLoaded,
    DarkmodeComponent.beforeDOMLoaded,
  )
  Component.afterDOMLoaded = concatenateResources(
    SearchComponent.afterDOMLoaded,
    DarkmodeComponent.afterDOMLoaded,
  )

  return Component
}

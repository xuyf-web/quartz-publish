import { Darkmode } from "@quartz-community/darkmode"
import { jsx, jsxs } from "preact/jsx-runtime"
import { SearchExperience } from "../search-experience/index.js"

const concatenateResources = (...resources) => resources.filter(Boolean).flat()

const homeSearchOverlay = `
const setupHomeSearchOverlay = () => {
  const search = document.querySelector(
    'body[data-slug="index"] .home-topbar-tools > .search',
  )
  const container = search?.querySelector(':scope > .search-container')
  if (!search || !container || search.dataset.homeSearchOverlayReady === "true") return

  search.dataset.homeSearchOverlayReady = "true"
  const placeholder = document.createComment("home-search-placeholder")
  let portaled = false

  const restore = () => {
    if (!portaled) return
    placeholder.replaceWith(search)
    search.removeAttribute("data-home-search-portal")
    portaled = false
  }

  const syncOverlayLayer = () => {
    if (container.classList.contains("active")) {
      if (portaled || !search.parentNode) return
      search.parentNode.insertBefore(placeholder, search)
      document.body.appendChild(search)
      search.setAttribute("data-home-search-portal", "")
      container.querySelector(".search-bar")?.focus()
      portaled = true
      return
    }

    restore()
  }

  const observer = new MutationObserver(syncOverlayLayer)
  observer.observe(container, { attributes: true, attributeFilter: ["class"] })
  syncOverlayLayer()

  window.addCleanup?.(() => {
    observer.disconnect()
    restore()
    search.removeAttribute("data-home-search-overlay-ready")
  })
}

document.addEventListener("nav", setupHomeSearchOverlay)
document.addEventListener("render", setupHomeSearchOverlay)
`

const sectionNavigation = `
const setupHomeSectionNavigation = () => {
  const topbar = document.querySelector(".home-topbar")
  if (!topbar) return

  const links = Array.from(topbar.querySelectorAll(".home-topbar-links a[data-section]"))
  const sections = links
    .map((link) => {
      const id = link.dataset.section
      return id ? { id, link, target: document.getElementById(id) } : null
    })
    .filter((entry) => entry?.target)

  if (sections.length === 0) return

  const activate = (activeId) => {
    topbar.dataset.activeSection = activeId ?? ""
    for (const { id, link } of sections) {
      const isActive = id === activeId
      link.classList.toggle("is-active", isActive)
      if (isActive) {
        link.setAttribute("aria-current", "location")
      } else {
        link.removeAttribute("aria-current")
      }
    }
  }

  let frame = 0
  const update = () => {
    frame = 0
    const stickyHeader = topbar.closest(".page-header")
    const activationLine = (stickyHeader ?? topbar).getBoundingClientRect().bottom + 36
    let activeId = null

    for (const { id, target } of sections) {
      if (target.getBoundingClientRect().top <= activationLine) activeId = id
    }

    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      activeId = sections.at(-1)?.id ?? activeId
    }

    activate(activeId)
  }

  const scheduleUpdate = () => {
    if (frame !== 0) return
    frame = window.requestAnimationFrame(update)
  }

  const cleanups = []
  for (const { id, link } of sections) {
    const showClickedSection = () => activate(id)
    link.addEventListener("click", showClickedSection)
    cleanups.push(() => link.removeEventListener("click", showClickedSection))
  }

  window.addEventListener("scroll", scheduleUpdate, { passive: true })
  window.addEventListener("resize", scheduleUpdate)
  cleanups.push(() => window.removeEventListener("scroll", scheduleUpdate))
  cleanups.push(() => window.removeEventListener("resize", scheduleUpdate))
  cleanups.push(() => frame && window.cancelAnimationFrame(frame))
  window.addCleanup?.(() => cleanups.forEach((cleanup) => cleanup()))

  update()
}

document.addEventListener("nav", setupHomeSectionNavigation)
document.addEventListener("render", setupHomeSectionNavigation)
`

export const HomeNavigation = () => {
  const SearchComponent = SearchExperience({
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
            jsx("a", {
              href: "#research-work",
              "data-section": "research-work",
              children: "研究工作",
            }),
            jsx("a", {
              href: "#featured-notes",
              "data-section": "featured-notes",
              children: "专题笔记",
            }),
            jsx("a", {
              href: "#file-sharing",
              "data-section": "file-sharing",
              children: "文件分享",
            }),
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
    homeSearchOverlay,
    sectionNavigation,
  )

  return Component
}

import { ContentBody } from "@quartz-community/content-page"
import { resolveRelative } from "@quartz-community/utils"

const collectionPages = new Map([
  ["collections/atmospheric-practice/index", "大气模式与数据实操"],
  ["collections/research-workflow/index", "科研工作流与工具链"],
  ["collections/ai-frontier/index", "AI 前沿观察"],
  ["collections/papers-methods/index", "论文与方法解析"],
])

const featuredCollections = new Set(collectionPages.values())

const textNode = (value) => ({ type: "text", value })

const articleDate = (page) => {
  const value = page.frontmatter?.date
  const parsed = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return { timestamp: 0, label: "" }
  }

  const label =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)
      ? value.slice(0, 10)
      : parsed.toISOString().slice(0, 10)

  return { timestamp: parsed.getTime(), label }
}

const articlePath = (page) => {
  const permalink = page.frontmatter?.permalink
  const path = typeof permalink === "string" && permalink ? permalink : page.slug
  return path.replace(/^\/+/, "")
}

const latestArticlesByCollection = (allFiles) => {
  const grouped = new Map([...featuredCollections].map((collection) => [collection, []]))

  for (const page of allFiles) {
    const collection = page.frontmatter?.collection
    const title = page.frontmatter?.title
    const slug = articlePath(page)

    if (!featuredCollections.has(collection) || !title || !slug) continue

    const date = articleDate(page)
    grouped.get(collection).push({ title, slug, ...date })
  }

  for (const articles of grouped.values()) {
    articles.sort(
      (left, right) =>
        right.timestamp - left.timestamp ||
        left.title.localeCompare(right.title, "zh-CN") ||
        left.slug.localeCompare(right.slug),
    )
  }

  return grouped
}

const collectionFromNode = (node) =>
  node.properties?.dataLatestCollection ?? node.properties?.["data-latest-collection"]

const articleListItems = (articles, sourceSlug) =>
  articles.map(({ title, slug, label }) => ({
    type: "element",
    tagName: "li",
    properties: {},
    children: [
      {
        type: "element",
        tagName: "a",
        properties: {
          href: resolveRelative(sourceSlug, slug),
          className: ["internal", "internal-link"],
          dataSlug: slug,
        },
        children: [textNode(title)],
      },
      {
        type: "element",
        tagName: "time",
        properties: label ? { dateTime: label } : {},
        children: label ? [textNode(label)] : [],
      },
    ],
  }))

const replaceFeaturedLists = (node, grouped, sourceSlug) => {
  if (!node || typeof node !== "object") return

  if (node.type === "element" && node.tagName === "ul") {
    const collection = collectionFromNode(node)
    const articles = grouped.get(collection)

    if (articles) {
      node.children = articleListItems(articles.slice(0, 3), sourceSlug)
    }
  }

  for (const child of node.children ?? []) {
    replaceFeaturedLists(child, grouped, sourceSlug)
  }
}

const replaceCollectionList = (node, articles, sourceSlug) => {
  if (!node || typeof node !== "object" || !Array.isArray(node.children)) return false

  const headingIndex = node.children.findIndex(
    (child) =>
      child?.type === "element" &&
      child.tagName === "h2" &&
      (child.properties?.id === "文章" || child.properties?.id === "%E6%96%87%E7%AB%A0"),
  )

  if (headingIndex >= 0) {
    const listIndex = node.children.findIndex(
      (child, index) => index > headingIndex && child?.type === "element" && child.tagName === "ul",
    )

    if (listIndex >= 0) {
      const list = node.children[listIndex]
      list.properties = {
        ...list.properties,
        className: [...(list.properties?.className ?? []), "collection-page-list"],
      }
      list.children = articleListItems(articles, sourceSlug)
      node.children.splice(listIndex, 0, {
        type: "element",
        tagName: "p",
        properties: { className: ["collection-list-summary"] },
        children: [textNode(`共 ${articles.length} 篇，按发布日期从新到旧`)],
      })
      return true
    }
  }

  return node.children.some((child) => replaceCollectionList(child, articles, sourceSlug))
}

const isSupportedPage = (slug) => slug === "index" || collectionPages.has(slug)

const transformLists = (root, slug, allFiles) => {
  const grouped = latestArticlesByCollection(allFiles)

  if (slug === "index") {
    replaceFeaturedLists(root, grouped, slug)
    return
  }

  const collection = collectionPages.get(slug)
  if (!collection) return
  replaceCollectionList(root, grouped.get(collection) ?? [], slug)
}

export const HomepageFeaturedNotes = () => ({
  name: "HomepageFeaturedNotes",
  priority: 100,
  match: ({ slug }) => isSupportedPage(slug),
  layout: "content",
  body: ContentBody,
  treeTransforms: () => [
    (root, slug, { allFiles }) => {
      if (!isSupportedPage(slug)) return
      transformLists(root, slug, allFiles)
    },
  ],
})

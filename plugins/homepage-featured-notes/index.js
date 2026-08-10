import { ContentBody } from "@quartz-community/content-page"

const featuredCollections = new Set([
  "大气模式与数据实操",
  "科研工作流与工具链",
  "AI 前沿观察",
  "论文与方法解析",
])

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

const replaceFeaturedLists = (node, grouped) => {
  if (!node || typeof node !== "object") return

  if (node.type === "element" && node.tagName === "ul") {
    const collection = collectionFromNode(node)
    const articles = grouped.get(collection)

    if (articles) {
      node.children = articles.slice(0, 3).map(({ title, slug, label }) => ({
        type: "element",
        tagName: "li",
        properties: {},
        children: [
          {
            type: "element",
            tagName: "a",
            properties: {
              href: `./${slug}`,
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
    }
  }

  for (const child of node.children ?? []) {
    replaceFeaturedLists(child, grouped)
  }
}

export const HomepageFeaturedNotes = () => ({
  name: "HomepageFeaturedNotes",
  priority: 100,
  match: ({ slug }) => slug === "index",
  layout: "content",
  body: ContentBody,
  treeTransforms: () => [
    (root, slug, { allFiles }) => {
      if (slug !== "index") return
      replaceFeaturedLists(root, latestArticlesByCollection(allFiles))
    },
  ],
})

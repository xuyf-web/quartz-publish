import fs from "node:fs/promises"
import path from "node:path"

export const SiteFiles = () => ({
  name: "SiteFiles",
  async *emit(ctx) {
    const baseUrl = ctx.cfg.configuration.baseUrl
    if (!baseUrl) return

    const outputPath = path.join(ctx.argv.output, "robots.txt")
    const robots = [
      "User-agent: *",
      "Allow: /",
      `Sitemap: https://${baseUrl}/sitemap.xml`,
      "",
    ].join("\n")

    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    await fs.writeFile(outputPath, robots, "utf8")
    yield outputPath
  },
  async *partialEmit() {},
})

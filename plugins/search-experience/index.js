import { Search } from "@quartz-community/search"
import { jsx } from "preact/jsx-runtime"
import styles from "./style.js"

const defaultOptions = {
  enablePreview: true,
  fieldPriority: ["title", "content", "tags"],
}

export const SearchExperience = (options = {}) => {
  const SearchComponent = Search({ ...defaultOptions, ...options })

  const Component = (props) => jsx(SearchComponent, props)

  Component.css = `${SearchComponent.css}\n${styles}`
  Component.beforeDOMLoaded = SearchComponent.beforeDOMLoaded
  Component.afterDOMLoaded = SearchComponent.afterDOMLoaded

  return Component
}

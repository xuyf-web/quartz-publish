const copyIcon = `
  <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
    <rect x="8" y="8" width="11" height="11" rx="2"></rect>
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path>
  </svg>
`

function codeText(code: HTMLElement): string {
  const serialized = code.dataset.clipboard
  if (serialized) {
    try {
      return String(JSON.parse(serialized)).replace(/\n\n/g, "\n")
    } catch {
      // Fall back to rendered text when a plugin provides malformed data.
    }
  }

  return code.innerText.replace(/\n\n/g, "\n")
}

function legacyCopy(text: string): boolean {
  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.readOnly = true
  textarea.setAttribute("aria-hidden", "true")
  textarea.style.position = "fixed"
  textarea.style.inset = "0 auto auto -9999px"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange(0, textarea.value.length)

  let copied = false
  try {
    copied = document.execCommand("copy")
  } catch {
    copied = false
  }

  textarea.remove()
  return copied
}

async function copyText(text: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // HTTP and restrictive browser policies still need a synchronous fallback.
    }
  }

  return legacyCopy(text)
}

function resetButton(button: HTMLButtonElement) {
  button.dataset.copyState = "idle"
  button.ariaLabel = "复制代码"
  const label = button.querySelector<HTMLElement>(".copy-label")
  if (label) label.textContent = "复制"
}

function installCopyButtons() {
  document.querySelectorAll<HTMLPreElement>("pre").forEach((pre) => {
    if (!pre.querySelector("code") || pre.querySelector(":scope > .clipboard-button")) return

    const button = document.createElement("button")
    button.className = "clipboard-button"
    button.type = "button"
    button.dataset.copyState = "idle"
    button.ariaLabel = "复制代码"
    button.innerHTML = `${copyIcon}<span class="copy-label">复制</span>`
    pre.prepend(button)
  })
}

async function handleCopy(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof Element)) return

  const button = target.closest<HTMLButtonElement>(".clipboard-button")
  if (!button) return

  event.preventDefault()
  const code = button.parentElement?.querySelector<HTMLElement>("code")
  if (!code) return

  const copied = await copyText(codeText(code))
  button.dataset.copyState = copied ? "copied" : "failed"
  button.ariaLabel = copied ? "代码已复制" : "复制失败"
  const label = button.querySelector<HTMLElement>(".copy-label")
  if (label) label.textContent = copied ? "已复制" : "复制失败"

  window.setTimeout(() => resetButton(button), 1800)
}

document.addEventListener("click", handleCopy)
document.addEventListener("nav", installCopyButtons)
document.addEventListener("render", installCopyButtons)

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", installCopyButtons, { once: true })
} else {
  installCopyButtons()
}

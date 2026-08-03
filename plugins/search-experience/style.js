export default `
.search {
  max-width: 15rem;
}

.search > .search-button {
  min-height: 2.35rem;
  padding: 0 0.9rem 0 0.25rem;
  border: 1px solid color-mix(in srgb, var(--darkgray) 22%, var(--lightgray));
  border-radius: 999px;
  background: color-mix(in srgb, var(--light) 88%, var(--secondary));
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, white 54%, transparent),
    0 5px 16px color-mix(in srgb, var(--dark) 7%, transparent);
  color: var(--darkgray);
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease,
    color 160ms ease;
}

.search > .search-button:hover,
.search > .search-button:focus-visible {
  border-color: color-mix(in srgb, var(--secondary) 48%, var(--lightgray));
  background: color-mix(in srgb, var(--light) 94%, var(--secondary));
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, white 62%, transparent),
    0 7px 22px color-mix(in srgb, var(--secondary) 11%, transparent);
  color: var(--secondary);
  outline: none;
}

.search > .search-button > p {
  margin: 0;
  color: currentColor;
  font-size: 0.88rem;
  font-weight: 620;
}

.search > .search-button svg {
  margin: 0 0.55rem 0 0.35rem;
}

.search > .search-button svg .search-path {
  stroke: currentColor;
}

.search > .search-container {
  box-sizing: border-box;
  padding: 0 2rem 2rem;
  background: color-mix(in srgb, var(--light) 42%, transparent);
  -webkit-backdrop-filter: blur(14px) saturate(0.9);
  backdrop-filter: blur(14px) saturate(0.9);
}

.search > .search-container > .search-space {
  width: min(74rem, calc(100vw - 5rem));
  margin-top: clamp(4.5rem, 9vh, 7rem);
}

.search > .search-container > .search-space > *:not(.ghost-text):not(.tag-suggestions) {
  border-radius: 16px;
  background: color-mix(in srgb, var(--light) 97%, var(--secondary));
  box-shadow:
    0 28px 80px color-mix(in srgb, var(--dark) 18%, transparent),
    0 8px 24px color-mix(in srgb, var(--dark) 10%, transparent);
}

.search > .search-container > .search-space > input {
  min-height: 3.35rem;
  padding: 0.75rem 1.15rem;
  border: 1px solid color-mix(in srgb, var(--secondary) 34%, var(--lightgray));
  font-size: 1.08rem;
}

.search > .search-container > .search-space > input:focus {
  border-color: var(--secondary);
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--secondary) 14%, transparent),
    0 22px 58px color-mix(in srgb, var(--dark) 16%, transparent);
}

.search > .search-container > .search-space > .search-layout {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--darkgray) 17%, var(--lightgray));
}

.search > .search-container > .search-space > .search-layout[data-preview] > .results-container {
  flex: 0 0 clamp(22rem, 42%, 31rem);
}

.search > .search-container > .search-space > .search-layout > div {
  height: min(68vh, 46rem);
}

.search > .search-container > .search-space > .search-layout > .results-container .result-card {
  padding: 1rem 1.15rem;
  line-height: 1.35;
}

.search > .search-container > .search-space > .search-layout > .results-container .result-card > h3 {
  font-size: 1.02rem;
  line-height: 1.35;
}

.search > .search-container > .search-space > .search-layout > .preview-container {
  padding: 0 clamp(1.5rem, 3vw, 3rem);
}

@media all and (max-width: 800px) {
  .search > .search-container {
    padding: 0 0.75rem 1.25rem;
    background: color-mix(in srgb, var(--light) 48%, transparent);
    -webkit-backdrop-filter: blur(16px) saturate(0.85);
    backdrop-filter: blur(16px) saturate(0.85);
  }

  .search > .search-container > .search-space {
    width: 100%;
    margin-top: max(4.25rem, env(safe-area-inset-top));
  }

  .search > .search-container > .search-space > *:not(.ghost-text):not(.tag-suggestions) {
    border-radius: 13px;
    margin-bottom: 0.85rem;
  }

  .search > .search-container > .search-space > input {
    min-height: 3rem;
    font-size: 1rem;
  }

  .search > .search-container > .search-space > .search-layout[data-preview] > .results-container {
    flex-basis: 100%;
    max-height: calc(100dvh - 9rem);
  }

  .search > .search-container > .search-space > .search-layout > .results-container .result-card {
    padding: 0.9rem 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .search > .search-button {
    transition: none;
  }
}
`

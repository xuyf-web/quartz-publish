export default `
.site-navigation {
  display: contents;
}

.site-sidebar-nav {
  display: grid;
  flex: 1;
  gap: 1.25rem;
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.3rem;
}

.site-sidebar-nav section {
  display: grid;
  gap: 0.45rem;
}

.site-sidebar-nav h3 {
  margin: 0 !important;
  font-size: 0.78rem !important;
  font-family: var(--codeFont) !important;
  font-weight: 700;
  letter-spacing: 0.09em;
}

.site-sidebar-nav ul {
  display: grid;
  gap: 0.16rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.site-sidebar-nav li {
  margin: 0;
}

.site-sidebar-nav a.sidebar-nav-link {
  display: block;
  border-radius: 8px;
  background: transparent;
  color: var(--darkgray);
  padding: 0.34rem 0.48rem;
  font-size: 0.83rem;
  font-weight: 560;
  line-height: 1.4;
}

.site-sidebar-nav a.sidebar-nav-link:hover {
  background: color-mix(in srgb, var(--secondary) 9%, transparent);
  color: var(--secondary);
}

.site-sidebar-nav a.sidebar-nav-link.is-active {
  background: color-mix(in srgb, var(--secondary) 13%, transparent);
  color: var(--secondary);
  box-shadow: inset 3px 0 0 var(--secondary);
}

.sidebar-nav-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

.site-sidebar-nav a.sidebar-nav-all {
  background: transparent;
  color: var(--gray);
  padding: 0;
  font-size: 0.72rem;
  font-weight: 600;
}

.site-sidebar-nav .sidebar-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.site-sidebar-nav .sidebar-tag-list a.tag-link {
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
  border-radius: 999px;
  padding: 0.23rem 0.48rem;
  font-size: 0.72rem;
  line-height: 1.35;
}

.site-sidebar-nav .sidebar-tag-list small {
  color: var(--gray);
  font-family: var(--codeFont);
  font-size: 0.62rem;
}

.site-sidebar-nav .sidebar-tag-list a.tag-link.is-active {
  background: color-mix(in srgb, var(--secondary) 14%, transparent);
  color: var(--secondary);
}

.mobile-site-nav {
  display: none;
}

@media all and (max-width: 800px) {
  .page > #quartz-body .left.sidebar {
    align-items: stretch;
    flex-wrap: wrap;
    gap: 0.65rem;
    padding-top: 1rem;
  }

  .site-navigation {
    display: block;
    flex: 1 0 100%;
    width: 100%;
  }

  .site-sidebar-nav.desktop-only {
    display: none;
  }

  details.mobile-site-nav.mobile-only {
    display: block;
    overflow: hidden;
    width: 100%;
    border: 1px solid color-mix(in srgb, var(--secondary) 18%, var(--lightgray));
    border-radius: 14px;
    background: color-mix(in srgb, var(--light) 96%, var(--secondary));
    box-shadow: 0 8px 24px rgb(25 38 54 / 6%);
  }

  .mobile-site-nav-summary {
    display: flex;
    min-height: 3.6rem;
    box-sizing: border-box;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.7rem 0.9rem;
    color: var(--dark);
    cursor: pointer;
    list-style: none;
    -webkit-tap-highlight-color: transparent;
  }

  .mobile-site-nav-summary::-webkit-details-marker {
    display: none;
  }

  .mobile-site-nav-heading {
    display: grid;
    gap: 0.12rem;
  }

  .mobile-site-nav-heading strong {
    font-size: 0.9rem;
    font-weight: 700;
  }

  .mobile-site-nav-heading small {
    color: var(--gray);
    font-family: var(--codeFont);
    font-size: 0.68rem;
    letter-spacing: 0.03em;
  }

  .mobile-site-nav-chevron {
    display: grid;
    width: 1.8rem;
    height: 1.8rem;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 50%;
    background: color-mix(in srgb, var(--secondary) 11%, transparent);
    color: var(--secondary);
    font-size: 1.05rem;
    line-height: 1;
    transition: transform 180ms ease;
  }

  .mobile-site-nav[open] .mobile-site-nav-summary {
    border-bottom: 1px solid color-mix(in srgb, var(--lightgray) 75%, transparent);
  }

  .mobile-site-nav[open] .mobile-site-nav-chevron {
    transform: rotate(180deg);
  }

  .mobile-site-nav-panel {
    display: grid;
    gap: 1rem;
    padding: 0.9rem;
  }

  .mobile-site-nav-panel section {
    display: grid;
    gap: 0.48rem;
  }

  .mobile-site-nav-panel h3 {
    margin: 0 !important;
    color: var(--gray);
    font-family: var(--codeFont) !important;
    font-size: 0.68rem !important;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  .mobile-site-nav-panel ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .mobile-site-nav-panel li {
    margin: 0;
  }

  .mobile-site-nav-panel .mobile-collection-list,
  .mobile-site-nav-panel .mobile-file-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.42rem;
  }

  .mobile-site-nav-panel a.sidebar-nav-link {
    display: flex;
    min-height: 2.35rem;
    box-sizing: border-box;
    align-items: center;
    border: 1px solid color-mix(in srgb, var(--lightgray) 80%, transparent);
    border-radius: 9px;
    background: color-mix(in srgb, var(--light) 97%, var(--secondary));
    color: var(--darkgray);
    padding: 0.45rem 0.58rem;
    font-size: 0.76rem;
    font-weight: 600;
    line-height: 1.3;
  }

  .mobile-site-nav-panel a.sidebar-nav-link.is-active {
    border-color: color-mix(in srgb, var(--secondary) 30%, var(--lightgray));
    background: color-mix(in srgb, var(--secondary) 13%, var(--light));
    color: var(--secondary);
    box-shadow: inset 3px 0 0 var(--secondary);
  }

  .mobile-site-nav-panel .sidebar-tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.36rem;
  }

  .mobile-site-nav-panel a.tag-link {
    display: inline-flex;
    align-items: baseline;
    gap: 0.25rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--secondary) 9%, transparent);
    color: var(--darkgray);
    padding: 0.3rem 0.55rem;
    font-size: 0.7rem;
    line-height: 1.3;
  }

  .mobile-site-nav-panel a.tag-link.is-active {
    background: color-mix(in srgb, var(--secondary) 17%, var(--light));
    color: var(--secondary);
  }

  .mobile-site-nav-panel a.sidebar-nav-all {
    color: var(--secondary);
    font-size: 0.68rem;
    font-weight: 650;
  }

  .mobile-site-nav-panel small {
    color: var(--gray);
    font-family: var(--codeFont);
    font-size: 0.6rem;
  }

  .page > #quartz-body .left.sidebar > .flex-component {
    width: 100%;
  }
}
`

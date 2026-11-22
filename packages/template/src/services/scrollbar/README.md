---
metadata:
    reviewed: 2026-11-22
---

# ServiceScrollbar

Style scroll containers with [OverlayScrollbars](https://github.com/KingSora/OverlayScrollbars). Configure the service in `config.services.scrollbar`.

Use `data-service-scrollbar` to select a theme for an element and its subtree. An empty value inherits the theme; `native` opts out. The configured mode determines whether containers opt in or out by default.

Themes live in `themes.scss`. Give scroll containers without focusable content a `tabindex` and accessible label.

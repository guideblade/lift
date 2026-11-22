---
metadata:
    reviewed: 2026-11-21
---

# BehaviorDiagramPele

Render Mermaid diagrams in the browser with [Pele](https://pele.run).

## Markup

Set `data-<block>-source` on the component root to the Mermaid source. Mark a full-width descendant with `data-<block>-stage` to hold the SVG.

For a JavaScript-free fallback, server-render an SVG inside the stage. To control zoom, set `data-<block>-zoom` on the root to `auto`, `always`, or `off`.

## API

Use `update(source)` to change the diagram after it renders. Customize its appearance with [Pele theme variables](https://pele.run/theming).

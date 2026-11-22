---
metadata:
    reviewed: 2026-11-22
---

# Page blueprints

Page creation copies the page blueprint without its `_ui` folder. Section creation copies its component from `_ui` and inserts it into the page.

The page blueprint includes a smoke test. Run page tests with `pnpm test:e2e`.

## Styling a page section

Section styles use mixins for the configured phases. Put base styles in the initial phase and overrides in the larger phases. The section component applies them through the `phase` mixin.

See the [style helpers](../../libs/styles/README.md) for sizing, breakpoints, and hover styles.

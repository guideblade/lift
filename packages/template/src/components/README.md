---
metadata:
    reviewed: 2026-11-21
---

# Components

Lift builds pages from four kinds of UI components.

- [Primitives](primitives/README.md) provide basic UI elements.
- [Blocks](blocks/README.md) combine primitives and other blocks.
- [Presets](presets/README.md) wrap a primitive or block behind one set of props.
- [Widgets](widgets/README.md) assemble components into page sections.

The CLI can create components from your project folder.

## Docs

Run `pnpm dev` and open `/components` to browse previews, prop controls, and samples.

## Blueprints

The generator copies blueprints from `src/components/<kind>/_blueprints/`. Edit the blueprint for a kind to change what new components start with.

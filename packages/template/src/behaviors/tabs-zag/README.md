---
metadata:
    reviewed: 2026-11-21
---

# BehaviorTabsZag

Add tab switching and keyboard navigation to a component with [Zag.js](https://zagjs.com). Server-render the selected panel to show its content before JavaScript loads. Switching tabs requires JavaScript.

## Markup

Use your component's block name for `<block>`. Give the component root its block class so the behavior finds the elements that belong to it.

- Mark the tab list with `data-<block>-list`.
- Put a `<button>` with `data-<block>-trigger` inside the list for each tab.
- Mark each panel with `data-<block>-panel` and give it the same value as its trigger.

Set `data-<block>-label` on the root to name the tab list for assistive technology. Use `data-<block>-value` to choose the initial tab.

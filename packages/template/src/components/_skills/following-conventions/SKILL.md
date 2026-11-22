---
name: following-conventions
description: Keep component convention indexes and blueprints in sync. Use when adding or changing a rule for component folders.
metadata:
    reviewed: 2026-11-22
---

# Following conventions in components

- Get the required families for each folder type from `src/components/_conventions/families.ts`.
- When adding a rule to a family, update every index that lists it, including blueprint indexes. Use `.off()` where the rule does not apply.
- In preset `ui` folders, use `preset.noStyles()` and omit the style and media families.

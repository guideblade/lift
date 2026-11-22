---
name: following-conventions
description: Define and register Lift convention rules. Use to add a check, move a shared rule, or enable or disable a rule in a folder.
metadata:
    reviewed: 2026-11-22
---

# Following conventions

1. Define the rule under `_conventions` in the folder that uses it. For shared rules, use the closest common ancestor and import the same definition in each folder.
2. Group rules by concern with `family('name', { key: rule('rule sentence', () => check) })`. The check takes `Lift.Scope` and returns `Lift.Violation[]`.
3. Default-export `rules(…)` from each folder’s `_conventions/index.ts`. Register file checks in the containing folder and child-name checks in the parent. List each family and each of its rules once. Use `.off()` where a rule does not apply.
4. From the project folder, run `pnpm lift conventions check <folder>` with a temporary violation. Confirm the message tells the reader how to fix it. Remove the probe and rerun the check. Confirm the rule’s description with `pnpm lift conventions list`.

---
name: fixing-bugs
description: Diagnose Text typography mismatches. Use when a Text variant or degree differs from the design at any container width.
metadata:
    reviewed: 2026-11-22
---

# Fixing bugs in Text

1. Check `variant` and `form` (defaults `primary` and `100`). Compare rendered typography with the design at small, medium, and large container widths.
2. Correct wrong props at the call site. Edit a shared degree in `ui/variant/` when it differs from the design system. Use a separate variant for a distinct typography system. If the design and its source disagree, resolve the discrepancy before editing shared styles.
3. After manual variant edits, run `pnpm lift components primitives text sync` from the project folder. Recheck affected widths and representative callers.

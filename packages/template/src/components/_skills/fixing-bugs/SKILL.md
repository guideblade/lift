---
name: fixing-bugs
description: Scope and verify component fixes. Use when a shared component behaves incorrectly in a section or variant.
metadata:
    reviewed: 2026-11-22
---

# Fixing bugs in components

1. Compare how the affected caller and a working caller configure the component.
2. Fix shared behavior in the component. For section-specific behavior, start with local composition or an existing prop or variant. Add an opt-in only for a distinct behavior callers need.
3. Identify affected callers before changing the component’s contract. Use a separate implementation if callers need a staged migration.
4. Check the reported section and a working caller. For visual fixes, cover the relevant widths and variants.

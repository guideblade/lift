---
name: fixing-bugs
description: Diagnose and fix a reported bug or help someone debug it. Use when behavior regressed or differs from an established expectation.
metadata:
    reviewed: 2026-11-17
---

# Fixing bugs

1. Identify the expected behavior from the report, design, or existing tests. Reproduce the discrepancy on the reported page or section. If the request changes the intended behavior, handle it as a requirement change.
2. Trace the issue to the page, component, or shared helper that owns the behavior. Check other callers for the same failure and look for an existing fix pattern.
3. Fix the cause at the narrowest scope that covers affected callers. Check how the change affects existing pages and future uses. If the user asks for diagnosis only, report the cause, affected scope, and proposed fix.
4. Repeat the original reproduction and check a representative unaffected caller if the fix touches shared code. Report what you verified and any behavior you could not reproduce.

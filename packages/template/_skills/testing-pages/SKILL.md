---
name: testing-pages
description: Write, run, or debug Playwright browser tests for Lift pages. Use for page smoke tests, interactions, and browser failures.
metadata:
    reviewed: 2026-11-17
---

# Testing pages

1. Find the page and its tests under `src/pages/<page>/_e2e/`. For a generated page, start with its existing smoke test. Check `_page.ts` for locales or states. For a dynamic route, pass a concrete segment to `smokePage`, as in the blog smoke test.
2. For an interaction, import `test` and `expect` from `@e2e`, navigate with the `route` fixture, and assert an observable result. See the [e2e README](../../e2e/README.md) for an example and fixture options.
3. Run the affected test from the project folder. For example, `pnpm test:e2e blog/_e2e/smoke` runs the blog smoke test. Confirm Playwright ran the intended test and that the assertion covers the behavior.

If a test fails, inspect it with `pnpm test:e2e --ui` or open the report with `pnpm exec playwright show-report .playwright/report`. The fixture reports browser errors, uncaught exceptions, and failed requests. If Playwright reports a missing Chromium executable, run `pnpm exec playwright install chromium`.

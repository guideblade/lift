---
metadata:
    reviewed: 2026-11-21
---

# Lighthouse

Run Lighthouse locally against your project's production build to check performance, accessibility, best practices, and SEO.

Find the Lighthouse audit through `pnpm lift --help`.

Lift builds the project first. Use `--no-build` when you already have a production build for the configured base path.

## Chrome

The audit needs Chrome or Chromium. To install Chromium from the repo root, run `pnpm --filter @lift/cli exec playwright install chromium`.

## Output

Open `lighthouse-report/index.html` in the project for scores and links to each page's report. Scores below an `error` threshold fail the audit. Scores below a `warn` threshold are flagged for review.

## Tuning

Set site-wide thresholds or page-specific rules under `lighthouse` in `lift.config.ts`. See the [configuration types](../contract/v1/lift.d.ts) and [defaults](config.ts).

---
metadata:
    reviewed: 2026-11-21
---

# e2e

Run page tests in Chromium with Playwright. From the project folder, install Chromium on first use, then run the tests.

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

The test runner starts Astro. To reuse a running server, set `E2E_BASE_URL` to the full URL, including any subpath.

Use `pnpm test:e2e --ui` to rerun tests interactively or `pnpm exec playwright show-report .playwright/report` to open the latest report.

## Writing tests

Keep `*.e2e.ts` files in the page's `_e2e/` folder. Page creation adds a smoke test that checks whether the page loads without browser errors. Add a test to check what a visitor sees.

```ts
import { expect, test } from '@e2e'

test('shows the heading', async ({ page, route }) => {
	await page.goto(`./${route.slice(1)}`)
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
```

Use `test.use({ allowIssues: [/message pattern/] })` to allow a known browser issue.

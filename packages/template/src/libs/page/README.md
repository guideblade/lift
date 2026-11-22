---
metadata:
    reviewed: 2026-11-22
---

# Page

A page configuration defines its ID, status, and optional languages and states.

```ts
import type { PageConfig } from '@libs/page'

export const page = {
	id: 'search',
	status: 'ready',
	locales: ['en', 'ru'],
	states: ['empty'],
} as const satisfies PageConfig
```

## States

A state adds a URL such as `/search/@empty/` for the same page template. State URLs are excluded from indexing and the sitemap.

## Languages

If `locales` is omitted, the page uses the site's configured language. The default language has no URL prefix. Other languages use a prefix, such as `/ru/search/`.

Pages with languages or states need an `index.astro` entry. Use `pageContext` from `@libs/page` to resolve the current locale and state.

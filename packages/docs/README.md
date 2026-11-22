---
metadata:
    reviewed: 2026-11-21
---

# @lift/docs

Publishes repository READMEs, skills, briefs, and `CONTRIBUTING.md` as a [VitePress](https://vitepress.dev) site.

```sh
pnpm --filter @lift/docs dev
pnpm --filter @lift/docs build
```

## Writing READMEs

Use relative links between published Markdown files. Link to `/` for the site homepage, which comes from the root README. Use repository URLs for source files.

## Base path

For deployment under a subpath, set `BASE_PATH` before building. For example, set it to `/lift/` for a site served under `/lift/`.

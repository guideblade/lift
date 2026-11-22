---
metadata:
    reviewed: 2026-11-21
---

# Lift template

The default starter for Astro sites with TypeScript, Vue islands, Tailwind CSS, and SCSS. Edit routes in `src/pages/` and site settings in `src/site/config/site.config.ts`.

## Commands

Run these from your project folder.

- `pnpm dev` starts the site and prints its local URL.
- `pnpm build` builds the static site into `dist/`.
- `pnpm verify` checks formatting, lint, and conventions, runs unit tests, builds the site, and audits HTML, DOM size, and Sass.
- `pnpm test` runs unit and browser tests. [Browser test setup](e2e/README.md)

## Lift commands

The CLI can create pages and sections. Use `pnpm lift --help` to find commands. To change what generators create, edit their blueprints. [Components](src/components/README.md#blueprints) · [Pages](src/pages/_blueprints/README.md) · [Services](src/services/_blueprints/README.md)

## Skills and conventions

Read the convention guidance for a folder before editing it. The CLI's skills commands show the guidance for a path.

## Hosting

Serve `dist/` with a static host. Before building, set `PUBLIC_URL` to your public site URL in the environment or `.env`. If the site lives under a subpath, set `BASE_PATH` too, such as `/my-project/`.

On GitLab Pages, `PUBLIC_URL` defaults to `CI_PAGES_URL` and `BASE_PATH` defaults to its path.

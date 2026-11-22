---
metadata:
    reviewed: 2026-11-17
---

# Lift

A template engine for creating websites with Astro.

Requires Node.js 24 (`.nvmrc`), pnpm 11, Git, and Git LFS.

| Package          | Folder              | What it is                                                                               |
| :--------------- | :------------------ | :--------------------------------------------------------------------------------------- |
| `@lift/cli`      | `packages/cli`      | Provides workflow commands ([README](packages/cli/README.md))                            |
| `@lift/docs`     | `packages/docs`     | Composes every README in the repo into a single site ([README](packages/docs/README.md)) |
| `@lift/template` | `packages/template` | The default project ([README](packages/template/README.md))                              |

## Creating a project

Get a local copy of Lift. From the Lift folder, fetch the Git LFS assets and install the workspace dependencies. `[↓]`

```sh
git lfs pull
pnpm install --frozen-lockfile
```

Set your Git author name and email (`user.name` and `user.email`) before creating a project. Commit changes in the source project (`template` by default) before running the command.

```sh
pnpm lift project create my-site
```

`[↑]` Where `my-site` is the new project's name.

Lift creates and commits each new project under `packages/<name>`.

```sh
pnpm install
pnpm --filter my-site dev
```

`[↑]` Run your newly created project named `my-site`.

| Command             | Action                                                                |
| :------------------ | :-------------------------------------------------------------------- |
| `pnpm lift`         | The [lift CLI](packages/cli/README.md), like `pnpm lift audit`        |
| `pnpm lint`         | Apply lint fixes to root Markdown and run each package’s lint command |
| `pnpm lint:check`   | Check root Markdown and run each package’s lint checks                |
| `pnpm format`       | Format root and package files                                         |
| `pnpm format:check` | Check formatting in the root and each package                         |

Learn more by reading the docs.

## Workflow

To start working on your project(s):

- Get a local copy of Lift
- Study the template. Your new project's structure will be cloned from it. You are welcome to modify it so it suits your future project(s)
- Create new project from the template
- Work on your project: create pages, import components from the template to edit them or use as is, or create new project specific ones yourself
    - Mind the checks. Make sure the files you create or edit pass the linting and formatting
    - It is recommended for you to pass the quality gates before committing. That includes lighthouse, and html validation
- Build it and it's ready to be put on the server!

## Contact me

- Personal Website: <https://guideblade.ru> (yes, it's made with Lift)
- Telegram: [@sentientmode](https://t.me/sentientmode)
- Email: [nick@guideblade.ru](mailto:nick@guideblade.ru)

Happy building!
